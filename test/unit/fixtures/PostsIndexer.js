'use_strict'

const IndexKeeper = require('../../../src/IndexKeeper')

class PostsIndexer extends IndexKeeper {
  /**
   * This method will be called to create the index.
   *
   * @return {Promise}
   */
  up () {
    return this.engine.createIndex('posts', {
      settings: {
        index: {
          number_of_shards: 1,
          number_of_replicas: 0
        }
      },
      mappings: {
        _doc: {
          properties: {
            id: { type: 'keyword' },
            title: { type: 'text', analyzer: 'standard' },
            status: { type: 'keyword' },
            created_at: { type: 'date' },
            updated_at: { type: 'date' }
          }
        }
      }
    })
  }

  /**
   * This method will be called to drop the index.
   *
   * @return {void}
   */
  down () {
    return this.engine.deleteIndex('posts')
  }
}

module.exports = PostsIndexer
