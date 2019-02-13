'use strict'

const { ioc } = require('@adonisjs/fold')
const { Macroable } = require('macroable')
const CE = require('../src/Exceptions')

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
    this.rules = []
    this.wheres = []
    this.limit = null
    this.orders = []
    this.aggregates = []
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
   * Add a search rule to the search query.
   *
   * @param {String} ruleClass
   *
   * @return {Builder}
   */
  rule (ruleClass) {
    let modelRules = this.model.searchableRules()

    if (typeof modelRules === 'string') {
      modelRules = [ modelRules ]
    }

    if (modelRules.includes(ruleClass) === false) {
      throw CE.LogicalException.ruleNotSupported(ruleClass)
    }

    this.rules.push(ruleClass)
    return this
  }

  /**
   * Build all rules.
   *
   * @return {Object} Query
   */
  buildRules () {
    let queryObject = {}
    this.rules.forEach(ruleClass => {
      const searchRule = ioc.make(ruleClass)
      queryObject = Object.assign(queryObject, searchRule.buildQuery(this))
    })

    return queryObject
  }

  /**
   * Add a constraint to the search query.
   *
   * @param {String} field
   * @param {*} value
   *
   * @return {Builder}
   */
  where (field, operator, value) {
    this.wheres.push({ field, operator, value })
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
      throw CE.InvalidArgumentException.invalidParameter(
        `Direction should be either asc or desc (${direction} given)`
      )
    }

    this.orders.push({ field, direction })
    return this
  }

  /**
   * Add an aggregation to the search query.
   *
   * @param {String} operator
   * @param {String} field
   *
   * @return {Builder}
   */
  aggregate (operator, field) {
    this.aggregates.push({ operator, field })
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
