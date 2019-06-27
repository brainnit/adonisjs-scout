'use strict'

const PostsIndexer = require('./PostsIndexer')

module.exports = {
  setupTables (db) {
    const tables = [
      db.schema.createTable('posts', function (table) {
        table.increments()
        table.string('title')
        table.string('status', 32)
        table.timestamps()
      })
    ]
    return Promise.all(tables)
  },
  setupIndexes (scout) {
    const indexerInstance = new PostsIndexer(scout)
    return indexerInstance.up()
  },
  truncateTables (db) {
    const tables = [
      db.truncate('posts')
    ]
    return Promise.all(tables)
  },
  dropTables (db) {
    const tables = [
      db.schema.dropTable('posts')
    ]
    return Promise.all(tables)
  },
  dropIndexes (scout) {
    const indexerInstance = new PostsIndexer(scout)
    return indexerInstance.down()
  }
}
