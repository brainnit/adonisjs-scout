'use strict'

const AbstractDriver = require('./Abstract')
const elasticsearch = require('elasticsearch')

class ElasticsearchDriver extends AbstractDriver {
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
  setConfig (config) {
    const { connection, options } = config

    const httpAuth = (connection.user && connection.password)
      ? `${connection.user}:${connection.password}`
      : null

    this.transporter = new elasticsearch.Client({
      hosts: connection.hosts,
      httpAuth,
      ...options
    })
  }
}

module.exports = ElasticsearchDriver
