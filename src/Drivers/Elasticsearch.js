'use strict'

const AbstractDriver = require('./Abstract')
const ElasticsearchClient = require('elasticsearch').Client
const _ = require('lodash')
const bodybuilder = require('bodybuilder')

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
    this.config = config
    this.transporter = new ElasticsearchTransporter(this.config)
  }

  /**
   * Update the given model in the index.
   *
   * @async
   *
   * @param {Collection|Model} model
   *
   * @return {void}
   */
  async update (model) {
    if (!model) {
      return
    }

    /**
     * If models is array, dispatch update for each one of them
     */
    if (Array.isArray(model.rows)) {
      model.rows.forEach(modelInstance => {
        this.update(modelInstance)
      })
      return
    }

    /**
     * Initializes search index for the given model, if needed
     */
    await this.transporter.initIndex(model.searchableAs())

    /**
     * Save serialized model to the search engine, using the result
     * from `model.getSearchableKey()` as object id.
     */
    await this.transporter.index(
      model.searchableAs(),
      model.getSearchableKey(),
      model.toSearchableJSON()
    )
  }

  /**
   * Remove the given model from the index.
   *
   * @throws
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

    const objectIds = _.map(models.rows, model => {
      return model.getSearchableKey()
    })

    await this.transporter.deleteBulk(index, objectIds)
  }

  /**
   * Perform the given search on the engine.
   *
   * @throws
   *
   * @param {Builder} builder
   *
   * @return {void}
   */
  async search (builder) {
    const index = builder.index || builder.model.searchableAs()

    await this.transporter.initIndex(index)

    const queryDSL = this._buildQueryDSL(builder)

    return this.transporter.search(index, queryDSL)
  }

  /**
   * Build the Query DSL based on the builder state.
   *
   * @private
   *
   * @param {Builder} builder
   *
   * @return {Object}
   */
  _buildQueryDSL (builder) {
    // Uses the bodybuilder to help us build the query
    const queryBuilder = bodybuilder()

    // Tries to find the query string in any field
    queryBuilder.query('query_string', 'query', builder.query)

    // build the filters
    this._buildFilters(queryBuilder, builder.wheres)

    // build the sort
    this._buildSort(queryBuilder, builder.orders)

    // build the aggregates
    this._buildAggregates(queryBuilder, builder.aggregates)

    // build the search rules
    const rulesQuery = builder.buildRules()

    console.log(rulesQuery)

    return queryBuilder.build()
  }

  _buildFilters (queryBuilder, wheres) {
    if (!wheres) return

    wheres.forEach(where => {
      queryBuilder.filter(where.operator, where.field, where.value)
    })

    return queryBuilder
  }

  _buildSort (queryBuilder, orders) {
    if (!orders) return

    const sortArray = orders.map(order => {
      return { [order.field]: order.direction }
    })

    queryBuilder.sort(sortArray)

    return queryBuilder
  }

  _buildAggregates (queryBuilder, aggregates) {
    if (!aggregates) return

    aggregates.forEach(agg => {
      queryBuilder.aggregation(agg.operator, agg.field)
    })

    return queryBuilder
  }

  /**
   * Performs the given raw search on the engine.
   *
   * @param {String} index Index
   * @param {Object} queryDSL Query DSL
   *
   * @return {Promise}
   */
  async searchRaw (index, queryDSL) {
    await this.transporter.initIndex(index)
    return this.transporter.search(index, queryDSL)
  }

  /**
   * Perform the given search pagination on the engine.
   *
   * @throws
   *
   * @param {Builder} builder
   * @param {Number} size
   * @param {String} cursor
   *
   * @return {void}
   */
  paginate (builder, size, cursor) {
    throw Error
  }

  /**
   * Pluck and return the primary keys of the given results.
   *
   * @throws
   *
   * @param {Builder} builder
   * @param {*} results
   * @param {Model} model
   *
   * @return {Collection}
   */
  mapIds (builder, results, model) {
    throw Error
  }

  /**
   * Map the given results to instances of the given model.
   *
   * @throws
   *
   * @param {*} results
   *
   * @return {Collection}
   */
  map (results, model) {
    throw Error
  }

  /**
   * Get the total count from a raw result returned by the engine.
   *
   * @throws
   *
   * @param {*} results
   *
   * @return {Number}
   */
  getTotalCount (results) {
    throw Error
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
   * @param {String} name Index name
   * @param {Object} params Extra
   *
   * @return {Promise}
   */
  async initIndex (name, params = {}) {
    const exists = await this.Client.indices.exists({ index: name })
    const method = exists ? '_updateIndex' : '_createIndex'

    return this[method](name, params)
  }

  /**
   * Creates the given search index.
   *
   * @async
   *
   * @param {String} name Index name
   * @param {Object} params Extra
   *
   * @return {Boolean}
   */
  _createIndex (name, params = {}) {
    const requestPayload = {
      index: name,
      body: { ...params }
    }

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
   * @param {String} name Index name
   * @param {Object} params Extra
   *
   * @return {Boolean}
   */
  _updateIndex (name, params = {}) {
    const requestPayload = {
      index: name,
      body: { ...params }
    }

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
   * Add an object to Elasticsearch index.
   *
   * @async
   *
   * @param {String} index Index name
   * @param {String} objectId Object uid
   * @param {Object} objectData Object data
   *
   * @return {Promise}
   */
  index (index, objectId, objectData) {
    const requestPayload = {
      index,
      type: '_doc',
      id: objectId,
      ...objectData
    }

    return new Promise((resolve, reject) => {
      this.Client.index(requestPayload, (error, result) => {
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
   * @param {String} index Index name
   * @param {Array} objectIds Object Ids to delete
   *
   * @return {Promise}
   */
  deleteBulk (index, objectIds) {
    const bodyActions = objectIds.map(objectId => {
      return {
        delete: { _index: index, _type: '_doc', _id: objectId }
      }
    })

    return new Promise((resolve, reject) => {
      this.Client.bulk({ body: bodyActions }, (error, result) => {
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
    return new Promise((resolve, reject) => {
      this.Client.search({ index, body: queryDSL }, (error, result) => {
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
   *
   * @return {Promise}
   */
  flushIndex (name) {
    const requestPayload = {
      index: name,
      force: true,
      waitIfOngoing: true
    }

    return new Promise((resolve, reject) => {
      this.Client.indices.flush(requestPayload, (error, result) => {
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
