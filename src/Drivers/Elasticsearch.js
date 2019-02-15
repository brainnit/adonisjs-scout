'use strict'

const AbstractDriver = require('./Abstract')
const ElasticsearchClient = require('elasticsearch').Client
const bodybuilder = require('bodybuilder')
const _ = require('lodash')
const debug = require('debug')('scout:elasticsearch')

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

    const objectIds = _.map(models.rows, model => model.getSearchableKey())

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
   * Build the full Query DSL.
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

    // If there is no search rule applied
    if (builder.hasRules()) {
      // Adds search rules to the query
      builder.buildRules().forEach(query => {
        queryBuilder.query('bool', query)
      })
    } else if (builder.query && builder.query !== '*') {
      // Searches for `query` in any document field
      queryBuilder.query('query_string', 'query', builder.query)
    } else {
      // Match all
      queryBuilder.query('match_all', {})
    }

    // build the filters
    this._buildFilters(queryBuilder, builder.wheres)

    // build the sort
    this._buildSort(queryBuilder, builder.orders)

    // build the aggregates
    this._buildAggregates(queryBuilder, builder.aggregates)

    return queryBuilder.build()
  }

  /**
   * Build the filters part of the query.
   *
   * @param {bodybuilder} queryBuilder
   * @param {Array} wheres
   *
   * @return {bodybuilder}
   */
  _buildFilters (queryBuilder, wheres) {
    if (!wheres) return

    wheres.forEach(where => {
      queryBuilder.filter(where.operator, where.field, where.value)
    })

    return queryBuilder
  }

  /**
   * Build the sorting part of the query.
   *
   * @param {bodybuilder} queryBuilder
   * @param {Array} orders
   *
   * @return {bodybuilder}
   */
  _buildSort (queryBuilder, orders) {
    if (!orders) return

    orders.forEach(order => {
      queryBuilder.sort(order.field, order.direction)
    })

    return queryBuilder
  }

  /**
   * Build the aggregates part of the query.
   *
   * @param {bodybuilder} queryBuilder
   * @param {Array} aggregates
   *
   * @return {bodybuilder}
   */
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
   * @param {Object} results Query results
   *
   * @return {Array}
   */
  mapIds (results) {
    if (_.isEmpty(results) || results.hits.total === 0) {
      return []
    }

    return _.map(results.hits.hits, '_id')
  }

  /**
   * Map the given results to instances of the given model.
   *
   * @param {Builder} builder
   * @param {Object} results Query results
   * @param {Model} model
   *
   * @return {Collection}
   */
  map (builder, results, model) {
    if (_.isEmpty(results) || results.hits.total === 0) {
      const Serializer = model.constructor.resolveSerializer()
      return new Serializer([])
    }

    const { total, hits } = results.hits

    /**
     * Build array containing only the object ids
     */
    const objectIds = _.map(hits, '_id')

    /**
     * Search database through model class to find related models
     */
    const collection = model.getScoutModelsByIds(builder, objectIds)

    /**
     * Filter collection.rows to return only the models matching one of
     * the object ids returned from elasticsearch
     */
    collection.rows = _.filter(collection.rows, model => {
      return objectIds.includes(model.getSearchableKey())
    })

    return collection
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
   * @param {String} index
   * @param {Object} params Extra
   *
   * @return {Promise}
   */
  async initIndex (index, params = {}) {
    const requestPayload = { index }

    debug('Checking if index exists with %o', requestPayload)

    const exists = await this.Client.indices.exists(requestPayload)
    const method = exists ? '_updateIndex' : '_createIndex'

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
  _createIndex (index, params = {}) {
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
  _updateIndex (index, params = {}) {
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
   * Add an object to Elasticsearch index.
   *
   * @async
   *
   * @param {String} index
   * @param {String} objectId
   * @param {Object} objectData
   *
   * @return {Promise}
   */
  index (index, objectId, objectData) {
    const requestPayload = {
      index,
      type: '_doc',
      id: objectId,
      body: objectData
    }

    debug(`Indexing with %o`, requestPayload)

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
    const options = Object.assign({ force: true }, customOptions)

    const requestPayload = {
      index: name,
      ...options
    }

    debug('Flushing index with %o', requestPayload)

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
