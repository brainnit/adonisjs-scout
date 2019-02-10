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
   * Elasticsearch
   * ------------------------------------------------------------------------
   *
   * Elasticsearch is a distributed, RESTful search engine. Everything you
   * set under `options` will be passed directly to elasticsearch client
   * connection.
   *
   * See the docs:
   * @link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/configuration.html
   *
   * ```sh
   * npm i --save elasticsearch # to install via npm
   * yarn add elasticsearch # to install via yarn
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
    }
  }
}
