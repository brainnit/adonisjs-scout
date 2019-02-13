'use strict'

const { Macroable } = require('macroable')
const { InvalidArgumentException } = require('../src/Exceptions')

/**
 * @typedef {import('@adonisjs/lucid/src/Lucid/Model')} Model
 */

/**
 * @typedef {import('./Drivers/Abstract')} EngineDriver
 */

class Builder extends Macroable {
  /**
   * Create a new search builder instance.
   *
   * @param {Model} model
   * @param {String} query
   * @param {Function} callback
   *
   * @return {void}
   */
  constructor (model, query = null) {
    super()
    this.model = model
    this.query = query
    this.index = null
    this.wheres = []
    this.limit = null
    this.orders = []
  }

  /**
   * Specify a custom index to perform this search on.
   *
   * @param {String} index
   *
   * @return {Builder}
   */
  within (index) {
    this.index = index
    return this
  }

  /**
   * Add a constraint to the search query.
   *
   * @param {String} field
   * @param {*} value
   *
   * @return {Builder}
   */
  where (field, value) {
    this.wheres.push({ field, value })
    return this
  }

  /**
   * Set the "limit" for the search query.
   *
   * @param {Number} limit
   *
   * @return {Builder}
   */
  take (limit) {
    this.limit = limit
    return this
  }

  /**
   * Add an "order" for the search query.
   *
   * @param {String} field
   * @param {String} direction
   *
   * @return {Builder}
   */
  orderBy (field, direction = 'asc') {
    direction = direction.toLowerCase()
    if (direction !== 'asc' && direction !== 'desc') {
      throw InvalidArgumentException.invalidParameter(
        `Direction should be either asc or desc (${direction} given)`
      )
    }

    this.orders.push({ field, direction })
    return this
  }

  /**
   * Get the raw results of the search.
   *
   * @return {*}
   */
  raw () {
    return this.engine().search(this)
  }

  /**
   * Get the raw results of the search.
   *
   * @return {Collection}
   */
  keys () {
    return this.engine().keys(this)
  }

  /**
   * Get the results of the search.
   *
   * @return {Collection}
   */
  get () {
    return this.engine().get(this)
  }

  /**
   * Get the engine that should handle the query.
   *
   * @return {EngineDriver}
   */
  engine () {
    return this.model.searchableUsing()
  }
}

Builder._macros = {}
Builder._getters = {}

module.exports = Builder
