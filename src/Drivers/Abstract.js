'use strict'

const CE = require('../Exceptions')

class AbstractDriver {
  constructor () {
    if (new.target === AbstractDriver) {
      throw new TypeError('Cannot construct AbstractDriver directly')
    }
  }

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
  setConfig (config) {}

  update (models) {
    throw CE.LogicalException.notImplementedMethod('update')
  }

  delete (models) {
    throw CE.LogicalException.notImplementedMethod('delete')
  }

  search (builder) {
    throw CE.LogicalException.notImplementedMethod('search')
  }

  paginate (builder, size, cursor) {
    throw CE.LogicalException.notImplementedMethod('paginate')
  }

  mapIds (results) {
    throw CE.LogicalException.notImplementedMethod('mapIds')
  }

  map (results, model) {
    throw CE.LogicalException.notImplementedMethod('map')
  }

  getTotalCount (results) {
    throw CE.LogicalException.notImplementedMethod('getTotalCount')
  }
}

module.exports = AbstractDriver
