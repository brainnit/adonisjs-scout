'use strict'

const Env = use('Env')

module.exports = {

  /**
   * ------------------------------------------------------------------------
   * Default Search Engine
   * ------------------------------------------------------------------------
   *
   * This option controls the default search connection that gets used while
   * using AdonisJs Scout. This connection is used when syncing all your
   * Lucid models to the search engine. You should adjust this based on
   * your needs.
   *
   * Supported: "elasticsearch", "null"
   */
  driver: Env.get('SCOUT_DRIVER', 'elasticsearch'),

  /**
   * ------------------------------------------------------------------------
   * Index Prefix
   * ------------------------------------------------------------------------
   *
   * Here you can specify a prefix that will be applied to all search index
   * names used by Scout. This prefix may be useful if you have multiple
   * "tenants" or applications sharing the same search infrastructure.
   */
  prefix: Env.get('SCOUT_PREFIX', ''),

  /**
   * ------------------------------------------------------------------------
   * Chunk Sizes
   * ------------------------------------------------------------------------
   *
   * These options allow you to control the maximum chunk size when you are
   * mass importing data into the search engine. This allows you to fine
   * tune each of these chunk sizes based on the power of the servers.
   */
  chunk: {
    searchable: 500,
    unsearchable: 500
  },

  /**
   * ------------------------------------------------------------------------
   * Elasticsearch
   * ------------------------------------------------------------------------
   *
   * Elasticsearch is a distributed, RESTful search engine. Everything you
   * set under `options` will be passed directly to elasticsearch client
   * connection.
   *
   * ```sh
   * # to install via npm
   * npm i --save elasticsearch bodybuilder
   * # to install via yarn
   * yarn add elasticsearch bodybuilder
   * ```
   */
  elasticsearch: {
    connection: {
      hosts: [
        Env.get('ELASTICSEARCH_HOST', 'localhost:9200')
      ],
      user: Env.get('ELASTICSEARCH_USER', 'elastic'),
      password: Env.get('ELASTICSEARCH_PASSWORD', 'secret')
    },
    options: {
      apiVersion: '6.4'
    },
    debug: Env.get('ELASTICSEARCH_DEBUG', false)
  },

  /**
   * ------------------------------------------------------------------------
   * Null
   * ------------------------------------------------------------------------
   *
   * Simple search engine that does and needs nothing. Very useful for
   * testing thought
   */
  null: {}
}
