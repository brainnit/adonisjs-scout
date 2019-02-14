'use strict'

const AbstractDriver = require('./Abstract')

/**
 * Search engine driver that does nothing.
 */
class NullDriver extends AbstractDriver {
  setConfig (config) {}
  update (models) {}
  delete (models) {}
  search (builder) {}
  searchRaw (index, queryObject) {}
  paginate (builder, size, cursor) {}
  mapIds (results) {}
  map (results, model) {}
  getTotalCount (results) {}
  flush (model) {}
}

module.exports = NullDriver
