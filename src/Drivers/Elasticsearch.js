'use strict'

const AbstractDriver = require('./Abstract')
const ElasticsearchClient = require('elasticsearch').Client

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
   * @throws
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
     * Save serialized model to the search engine,
     * using as UID the result from `model.getSearchableKey()`.
     */
    this.transporter.index(
      model.searchableAs(),
      model.getSearchableKey(),
      model.toSearchableJSON()
    )
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
    this.transporter.emptyIndex(index)
  }
}

class ElasticsearchTransporter {
  constructor (config) {
    this.config = config
    this.Client = this.makeClient()
  }

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
   * @link https://www.elastic.co/guide/en/elasticsearch/reference/6.4/indices-create-index.html
   *
   * @throws
   *
   * @param {String} name Index name
   * @param {Object} params Extra
   *
   * @return {Boolean}
   */
  async initIndex (name, params = {}) {
    const exists = await this.Client.indices.exists({ index: name })
    const method = exists ? '_updateIndex' : '_createIndex'
    const response = await this[method](name, params)
    return response
  }

  /**
   * Creates the given search index.
   *
   * @param {String} name Index name
   * @param {Object} params Extra
   *
   * @return {Boolean}
   */
  async _createIndex (name, params = {}) {
    const requestPayload = {
      index: name,
      body: { ...params }
    }
    const response = await this.Client.indices.create(requestPayload)
    return !!response.acknowledged
  }

  /**
   * Creates the given search index.
   *
   * @param {String} name Index name
   * @param {Object} params Extra
   *
   * @return {Boolean}
   */
  async _updateIndex (name, params = {}) {
    const requestPayload = {
      index: name,
      body: { ...params }
    }
    const response = await this.Client.indices.upgrade(requestPayload)
    return !!response.acknowledged
  }

  /**
   * Flush entire index removing all objects.
   *
   * @link https://www.elastic.co/guide/en/elasticsearch/reference/6.4/indices-flush.html
   *
   * @throws
   *
   * @param {String} name Index name
   *
   * @return {Boolean}
   */
  async flushIndex (name) {
    const requestPayload = {
      index: name,
      force: true,
      waitIfOngoing: true
    }
    const response = await this.Client.indices.flush(requestPayload)
    console.log(response)
    return !!response
  }

  index (index, objectId, objectData) {
    const requestPayload = {
      index,
      type: '_doc',
      id: objectId,
      ...objectData
    }
    const response = this.Client.index(requestPayload)
    return !!response
  }

  delete (index, objectId) {
    const requestPayload = {
      index,
      type: '_doc',
      id: objectId
    }
    const response = this.Client.delete(requestPayload)
    console.log(response)
    return !!response
  }
}

module.exports = Elasticsearch
module.exports.Transport = ElasticsearchTransporter
