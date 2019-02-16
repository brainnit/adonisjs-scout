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
   * @param {Number} page
   * @param {Number} limit
   *
   * @return {void}
   */
  paginate (builder, page, limit) {
    throw CE.LogicalException.notImplementedMethod('paginate')
  }

  /**
   * Perform the given search pagination on the engine.
   *
   * @throws
   *
   * @param {Builder} builder
   * @param {String} cursor
   * @param {Number} limit
   *
   * @return {void}
   */
  paginateAfter (builder, cursor, limit) {
    throw CE.LogicalException.notImplementedMethod('paginateAfter')
  }

  /**
   * Pluck and return the primary keys of the given results.
   *
   * @param {*} results
   *
   * @return {Collection}
   */
  mapIds (results) {
    throw CE.LogicalException.notImplementedMethod('mapIds')
  }

  /**
   * Map the given results to instances of the given model.
   *
   * @param {Builder} builder
   * @param {*} results
   * @param {Model} model
   *
   * @return {Collection}
   */
  map (builder, results, model) {
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
   * @return {Promise}
   */
  keys (builder) {
    return this.search(builder).then(
      results => this.mapIds(results)
    )
  }

  /**
   * Get the results of the given query mapped onto models.
   *
   * @param {Builder} builder
   *
   * @return {Promise}
   */
  get (builder) {
    return this.search(builder).then(
      results => this.map(builder, results, builder.model)
    )
  }
}

module.exports = AbstractDriver
