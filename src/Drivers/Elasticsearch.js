'use strict'

const AbstractDriver = require('./Abstract')
const ElasticsearchClient = require('elasticsearch').Client
const _ = require('lodash')

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
  update (model) {
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
    this.transporter.initIndex(model.searchableAs())

    /**
     * Save serialized model to the search engine, using the result
     * from `model.getSearchableKey()` as object id.
     */
    this.transporter.index(
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
  delete (models) {
    if (!models) {
      return
    }

    const index = models.first().searchableAs()

    this.transporter.initIndex(index)

    const objectIds = _.map(models.rows, model => {
      return model.getSearchableKey()
    })

    this.transporter.deleteBulk(index, objectIds)
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
  flush (model) {
    const index = model.searchableAs()
    this.transporter.initIndex(index)
    this.transporter.flushIndex(index)
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
