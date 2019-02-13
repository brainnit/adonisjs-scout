'use strict'

const CE = require('../Exceptions')

/**
 * @typedef {import('./src/Builder')} Builder
 */

/**
 * @typedef {import('@adonisjs/lucid/src/Lucid/Model')} Model
 */

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
   * @throws
   *
   * @param {Object} config
   *
   * @return {void}
   */
  setConfig (config = {}) {
    throw CE.LogicalException.notImplementedMethod('setConfig')
  }

  /**
   * Updates the given model in the index.
   *
   * @throws
   *
   * @param {Collection|Model} models
   *
   * @return {void}
   */
  update (models) {
    throw CE.LogicalException.notImplementedMethod('update')
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
    throw CE.LogicalException.notImplementedMethod('delete')
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
  search (builder) {
    throw CE.LogicalException.notImplementedMethod('search')
  }

  /**
   * Perform the given search on the engine.
   *
   * @throws
   *
   * @param {*} ...params
   *
   * @return {void}
   */
  searchRaw (...params) {
    throw CE.LogicalException.notImplementedMethod('searchRaw')
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
    throw CE.LogicalException.notImplementedMethod('paginate')
  }

  /**
   * Pluck and return the primary keys of the given results.
   *
   * @throws
   *
   * @param {Builder} builder
   * @param {*} results
   * @param {Model} model
   *
   * @return {Collection}
   */
  mapIds (builder, results, model) {
    throw CE.LogicalException.notImplementedMethod('mapIds')
  }

  /**
   * Map the given results to instances of the given model.
   *
   * @throws
   *
   * @param {*} results
   *
   * @return {Collection}
   */
  map (results, model) {
    throw CE.LogicalException.notImplementedMethod('map')
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
    throw CE.LogicalException.notImplementedMethod('getTotalCount')
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
    throw CE.LogicalException.notImplementedMethod('flush')
  }

  /**
   * Get the results of the query as a Collection of primary keys.
   *
   * @param {Builder} builder
   *
   * @return {Collection}
   */
  keys (builder) {
    return this.mapIds(this.search(builder))
  }

  /**
   * Get the results of the given query mapped onto models.
   *
   * @param {Builder} builder
   *
   * @return {Collection}
   */
  get (builder) {
    return this.map(builder, this.search(builder), builder.model)
  }
}

module.exports = AbstractDriver
