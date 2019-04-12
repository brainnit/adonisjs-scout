'use strict'

const AbstractDriver = require('./Abstract')
const ElasticsearchClient = require('elasticsearch').Client
const Promise = require('bluebird')
const { get, map, filter, groupBy, pickBy, size } = require('lodash')
const debug = require('debug')('scout:elasticsearch')
const { InvalidArgumentException } = require('../Exceptions')

/**
 * @typedef {import('../Builder')} Builder
 */

class Elasticsearch extends AbstractDriver {
  /**
   * This method is called by engine manager automatically
   * and passes the config object.
   *
   * @method setConfig
   *
   * @param {Object} config
   *
   * @return {void}
   */
  setConfig (config = {}) {
    // Toggle debugging
    debug.enable = !!config.debug
    debug('booting elasticsearch driver')

    this.config = config
    this.transporter = new ElasticsearchTransporter(this.config)
  }

  /**
   * Update the given model in the index.
   *
   * @async
   *
   * @param {Collection|Model} models
   *
   * @return {void}
   */
  async update (models) {
    if (!models) {
      return
    }

    models = Array.isArray(models.rows) ? models.rows : [models]

    const index = models[0].searchableAs()

    /**
     * Initializes search index for the given model, if needed
     */
    await this.transporter.initIndex(index)

    /**
     * Stores all serialization promises to work with later
     */
    const bulk = models.map(async model => ({
      id: model.getSearchableKey(),
      data: await model.toSearchableJSON()
    }))

    /**
     * Save serialized models to the search engine, using the result
     * from `model.getSearchableKey()` as object id.
     */
    return this.transporter.indexBulk(index, await Promise.all(bulk))
  }

  /**
   * Remove the given model from the index.
   *
   * @async
   *
   * @param {Collection|Model} models
   *
   * @return {void}
   */
  async delete (models) {
    if (!models) {
      return
    }

    const index = models.first().searchableAs()

    await this.transporter.initIndex(index)

    const objectIds = map(models.rows, model => model.getSearchableKey())

    return this.transporter.deleteBulk(index, objectIds)
  }

  /**
   * Perform the given search on the engine.
   *
   * @async
   *
   * @param {Builder} builder
   *
   * @return {Promise}
   */
  search (builder) {
    const { limit } = builder
    return this._performSearch(builder, { limit })
  }

  /**
   * Perform the given search on the engine.
   *
   * @async
   *
   * @param {Builder} builder
   * @param {Object} options
   *
   * @return {Promise}
   */
  _performSearch (builder, options = {}) {
    /**
     * Defaults index name to `model.searchableAs()`
     */
    const index = builder.index || builder.model.searchableAs()

    /**
     * Build full query DSL.
     */
    const queryDSL = this._buildQueryDSL(builder, options)

    return this.transporter.initIndex(index).then(() => {
      return this.transporter.search(index, queryDSL)
    })
  }

  /**
   * Build the full Query DSL.
   *
   * @private
   *
   * @param {Builder} builder
   * @param {Object} customOptions
   *
   * @return {Object}
   */
  _buildQueryDSL (builder, customOptions = {}) {
    const options = Object.assign({ page: null, limit: null }, customOptions)
    const queryBlocks = []

    /**
     * Matches the query terms either directly or via search rules.
     */
    if (builder.hasRules()) {
      queryBlocks.push(this._rules(builder.buildRules()))
    } else {
      queryBlocks.push(this._query(builder.query))
    }

    /**
     * Group components by the `grouping` property.
     */
    const stmts = groupBy(builder.statements, 'grouping')

    /**
     * List of query components to build.
     */
    const components = ['where', 'order', 'aggregate']

    /**
     * Loop through each query component building it separately.
     */
    components.forEach(component => {
      queryBlocks.push(this[`_${component}`](stmts[component]))
    })

    /**
     * Determine the results offset when paginating by page number
     */
    queryBlocks.push(this._buildFrom(options.page, options.limit))

    /**
     * Determine the number of results to bring back when paginating
     */
    queryBlocks.push(this._buildSize(options.limit))

    /**
     * Determine the last previous result when paginating by cursor
     */
    queryBlocks.push(this._buildAfter(options.after))

    let fullQuery = {}
    queryBlocks.forEach(block => Object.assign(fullQuery, block))

    return { query: fullQuery }
  }

  /**
   * Build the search rules part of the query.
   *
   * @param {Array} rules
   *
   * @return {Object}
   */
  _rules (rules) {
    if (!rules) return {}
    const ruleBlocks = rules.map(query => ({ bool: query }))

    return {
      bool: {
        must: [
          ...ruleBlocks
        ]
      }
    }
  }

  /**
   * Build the search for the given terms.
   *
   * @param {Null|String} query
   *
   * @return {Object}
   */
  _query (query) {
    if (!query) return {}
    if (query === '*') return { match_all: {} }

    return {
      query_string: {
        query
      }
    }
  }

  /**
   * Build the filters part of the query.
   *
   * @param {Array} stmts
   *
   * @return {Object}
   */
  _where (stmts) {
    if (!stmts) return {}

    const bool = {
      /**
       * All of these clauses must match. The equivalent of AND.
       */
      must: [],

      /**
       * All of these clauses must not match. The equivalent of NOT.
       */
      must_not: [],

      /**
       * At least one of these clauses must match. The equivalent of OR.
       */
      should: [],

      /**
       * Non-scoring, filters for structured search.
       */
      filter: []
    }

    stmts.forEach(stmt => {
      let value = this[`_${stmt.type}`](stmt)

      if (stmt.bool === 'and') {
        bool[stmt.not ? 'must_not' : 'must'].push(value)
      } else if (stmt.bool === 'or' && !stmt.not) {
        bool.should.push(value)
      } else if (stmt.bool === 'or' && stmt.not) {
        bool.should.push({
          bool: {
            must_not: value
          }
        })
      }
    })

    return {
      bool: pickBy(bool, size)
    }
  }

  /**
   * Build the `whereBasic` filter statements.
   *
   * @param {Object} stmt
   *
   * @return {Object}
   */
  _whereBasic (stmt) {
    switch (stmt.operator) {
      default:
        throw InvalidArgumentException.invalidParameter(
          `Operator not supported: ${stmt.operator}`
        )

      case '=':
        return {
          term: {
            [stmt.field]: stmt.value
          }
        }

      case '>':
      case '<':
      case '>=':
      case '<=':
        const rangeOperator = this._getRangeOperator(stmt.operator)
        return {
          range: {
            [stmt.field]: {
              [rangeOperator]: stmt.value
            }
          }
        }
    }
  }

  /**
   * Get the proper Elasticsearch range comparison operator
   * given a SQL type of operator.
   *
   * @param {String} operator
   */
  _getRangeOperator (operator) {
    const mapping = {
      '>': 'gt',
      '>=': 'gte',
      '<': 'lt',
      '<=': 'lte'
    }

    return mapping[operator]
  }

  /**
   * Build the `whereWrapped` filter statements.
   *
   * @param {Object} stmt
   *
   * @return {Object}
   */
  _whereWrapped (stmt) {
    const builder = stmt.value()
    const { query } = this._buildQueryDSL(builder)

    return query
  }

  /**
   * Build the `order` part of the query.
   *
   * @param {Array} stmts
   *
   * @return {Object}
   */
  _order (stmts) {
    if (!stmts) return {}

    const sort = []

    stmts.forEach(stmt => {
      let value = this[`_${stmt.type}`](stmt)
      sort.push(value)
    })

    return { sort }
  }

  /**
   * Build `orderByBasic` sort statements.
   *
   * @param {Object} stmt
   *
   * @return {Object}
   */
  _orderByBasic (stmt) {
    if (!stmt) return {}

    return {
      [stmt.value]: {
        order: stmt.direction
      }
    }
  }

  /**
   * Build the `aggs` part of the query.
   *
   * @param {Array} stmts
   *
   * @return {Object}
   */
  _aggregate (stmts) {
    if (!stmts) return {}

    const aggs = {}
    stmts.forEach(stmt => {
      let value = this[`_${stmt.type}`](stmt)
      Object.assign(aggs, value)
    })

    return { aggs }
  }

  /**
   * Build `aggregateBasic` aggregate statements.
   *
   * @param {Object} stmt
   *
   * @return {Object}
   */
  _aggregateBasic (stmt) {
    if (!stmt) return {}

    return {
      [`agg_${stmt.method}_${stmt.value}`]: {
        [stmt.method]: {
          field: stmt.value
        }
      }
    }
  }

  /**
   * Build the size part of the query.
   *
   * @param {Number} page
   * @param {Number} limit
   *
   * @return {Object}
   */
  _buildFrom (page, limit) {
    if (!page || !limit) return {}

    return {
      from: (page - 1) * limit
    }
  }

  /**
   * Build the size part of the query.
   *
   * @param {Number} size
   *
   * @return {Object}
   */
  _buildSize (size) {
    if (!size) return {}

    return { size }
  }

  /**
   * Build the search after part of the query.
   *
   * @param {*} cursor
   *
   * @return {Object}
   */
  _buildAfter (cursor) {
    if (!cursor) return {}

    return { search_after: cursor }
  }

  /**
   * Performs the given raw search on the engine.
   *
   * @param {String} index Index
   * @param {Object} queryObject Query DSL
   *
   * @return {Promise}
   */
  async searchRaw (index, queryObject) {
    await this.transporter.initIndex(index)

    return this.transporter.search(index, queryObject)
  }

  /**
   * Perform the given search pagination on the engine.
   *
   * @async
   *
   * @param {Builder} builder
   * @param {Number} page
   *
   * @return {void}
   */
  paginate (builder, page, limit) {
    return this._performSearch(builder, { page, limit })
  }

  /**
   * Perform the given search pagination on the engine.
   *
   * @async
   *
   * @param {Builder} builder
   * @param {*} after cursor
   *
   * @return {void}
   */
  paginateAfter (builder, after, limit) {
    return this._performSearch(builder, { after, limit })
  }

  /**
   * Pluck and return the primary keys of the given results.
   *
   * @param {Object} results Query results
   *
   * @return {Array}
   */
  mapIds (results) {
    if (get(results, 'hits.total', 0) === 0) {
      return []
    }

    return map(results.hits.hits, '_id')
  }

  /**
   * Map the given results to instances of the given model.
   *
   * @async
   *
   * @param {Builder} builder
   * @param {Object} results Query results
   * @param {Model} model
   *
   * @return {Collection}
   */
  map (builder, results, model) {
    if (get(results, 'hits.total', 0) === 0) {
      const Serializer = model.constructor.resolveSerializer()
      return new Serializer([])
    }

    const hits = get(results, 'hits.hits', [])

    /**
     * Build array containing only the object ids
     */
    const objectIds = map(hits, '_id')

    /**
     * Search database through model class to find related models
     */
    return model.getScoutModelsByIds(builder, objectIds).then(
      collection => {
        /**
         * Filter collection.rows to return only the models matching one of
         * the object ids returned from elasticsearch
         */
        collection.rows = filter(collection.rows, model => {
          return objectIds.includes(model.getSearchableKey())
        })

        return collection
      }
    )
  }

  /**
   * Get the total count from a raw result returned by the engine.
   *
   * @throws
   *
   * @param {*} results Query results
   *
   * @return {Number}
   */
  getTotalCount (results) {
    return get(results, 'hits.total', 0)
  }

  /**
   * Flush all of the model's records from the engine.
   *
   * @throws
   *
   * @param {Model} model
   *
   * @return {void}
   */
  async flush (model) {
    const index = model.searchableAs()
    await this.transporter.initIndex(index)
    await this.transporter.flushIndex(index)
  }
}

class ElasticsearchTransporter {
  constructor (config) {
    this.config = config
    this.Client = this.makeClient()
  }

  /**
   * Make client instance to work with.
   *
   * @param {ElasticsearchClient} ClientClass Client sdk
   *
   * @return {ElasticsearchClient}
   */
  makeClient (ClientClass = ElasticsearchClient) {
    const { connection, options } = this.config

    const httpAuth = (connection.user && connection.password)
      ? `${connection.user}:${connection.password}`
      : null

    return new ClientClass({
      hosts: connection.hosts,
      httpAuth,
      ...options
    })
  }

  /**
   * Create or updates the given search index.
   *
   * @async
   *
   * @throws
   *
   * @param {String} index
   * @param {Object} params Extra
   *
   * @return {Promise}
   */
  async initIndex (index, params = {}) {
    const requestPayload = { index }

    debug('Checking if index exists with %o', requestPayload)

    const exists = await this.Client.indices.exists(requestPayload)
    const method = exists ? 'updateIndex' : 'createIndex'

    return this[method](index, params)
  }

  /**
   * Creates the given search index.
   *
   * @async
   *
   * @param {String} index
   * @param {Object} params
   *
   * @return {Boolean}
   */
  createIndex (index, params = {}) {
    const requestPayload = {
      index,
      body: { ...params }
    }

    debug(`Creating index with %o`, requestPayload)

    return new Promise((resolve, reject) => {
      this.Client.indices.create(requestPayload, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * Updates the given search index.
   *
   * @param {String} index
   * @param {Object} params
   *
   * @return {Boolean}
   */
  updateIndex (index, params = {}) {
    const requestPayload = {
      index,
      body: { ...params }
    }

    debug(`Updating index with %o`, requestPayload)

    return new Promise((resolve, reject) => {
      this.Client.indices.upgrade(requestPayload, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * Add/Update objects to Elasticsearch index.
   *
   * @async
   *
   * @throws
   *
   * @param {String} index
   * @param {Array} objects
   *
   * @return {Promise}
   */
  indexBulk (index, objects) {
    const requestPayload = { body: [] }
    objects.forEach(object => {
      requestPayload.body.push(
        { index: { _index: index, _type: '_doc', _id: object.id } },
        object.data
      )
    })

    debug(`Removing from index with %o`, requestPayload)

    return new Promise((resolve, reject) => {
      this.Client.bulk(requestPayload, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * Remove objects from the index.
   *
   * @async
   *
   * @throws
   *
   * @param {String} index
   * @param {Array} objectIds
   *
   * @return {Promise}
   */
  deleteBulk (index, objectIds) {
    const requestPayload = {
      body: objectIds.map(objectId => {
        return {
          delete: { _index: index, _type: '_doc', _id: objectId }
        }
      })
    }

    debug(`Removing from index with %o`, requestPayload)

    return new Promise((resolve, reject) => {
      this.Client.bulk(requestPayload, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * Perform search on the specified index.
   *
   * @param {String} index Index name
   * @param {Object} queryDSL Query DSL
   *
   * @return {Promise}
   */
  search (index, queryDSL = {}) {
    const requestPayload = {
      index,
      body: queryDSL
    }

    debug('Searching with %o', requestPayload)

    return new Promise((resolve, reject) => {
      this.Client.search(requestPayload, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * Flush entire index removing all objects.
   *
   * @async
   *
   * @throws
   *
   * @param {String} name Index name
   * @param {Object} customOptions Extra options
   *
   * @return {Promise}
   */
  flushIndex (name, customOptions = {}) {
    const requestPayload = {
      index: name,
      ...customOptions,
      body: {
        query: {
          match_all: {}
        }
      }
    }

    debug('Flushing index with %o', requestPayload)

    return new Promise((resolve, reject) => {
      this.Client.deleteByQuery(requestPayload, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }
}

module.exports = Elasticsearch
module.exports.Transport = ElasticsearchTransporter
