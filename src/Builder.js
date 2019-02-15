'use strict'

const { ioc } = require('@adonisjs/fold')
const { Macroable } = require('macroable')
const LengthPaginator = require('./Paginators/LengthAwarePaginator')
const CE = require('./Exceptions')

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
   * @chainable
   *
   * @param {String} index
   *
   * @returns {Builder} this
   */
  within (index) {
    this.index = index
    return this
  }

  /**
   * Add a search rule to the search query.
   *
   * @chainable
   *
   * @param {String} ruleClass
   *
   * @return {Builder} this
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
   * Add a constraint to the search query.
   *
   * @chainbale
   *
   * @param {String} field
   * @param {*} value
   *
   * @return {Builder} this
   */
  where (field, operator, value) {
    this.wheres.push({ field, operator, value })
    return this
  }

  /**
   * Set the "limit" for the search query.
   *
   * @chainbale
   *
   * @param {Number} limit
   *
   * @return {Builder} this
   */
  take (limit) {
    this.limit = limit
    return this
  }

  /**
   * Add an "order" for the search query.
   *
   * @chainable
   *
   * @param {String} field
   * @param {String} direction
   *
   * @return {Builder} this
   */
  orderBy (field, direction = 'asc') {
    this.orders.push({ field, direction })
    return this
  }

  /**
   * Add an aggregation to the search query.
   *
   * @chainable
   *
   * @param {String} operator
   * @param {String} field
   *
   * @return {Builder} this
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
   * Check if some search rule was applied.
   *
   * @return {Boolean}
   */
  hasRules () {
    return !!this.rules.length
  }

  /**
   * Build all search rules to query the index.
   *
   * @return {Array} Query rules
   */
  buildRules () {
    const queryArray = []
    this.rules.forEach(ruleClass => {
      let SearchRule = ioc.use(ruleClass)
      queryArray.push((new SearchRule(this)).buildQuery())
    })

    return queryArray
  }

  /**
   * Paginate the given query into a simple paginator.
   *
   * @param {Number} [page = 1]
   * @param {Number} [limit = 20]
   *
   * @return {*}
   */
  paginate (page = 1, limit = 10) {
    /**
     * Make sure `page` and `limit` are both integers.
     */
    if (!Number.isInteger(page) || !Number.isInteger(limit)) {
      throw CE.InvalidArgumentException.invalidParameter(
        `page|limit bust be an integer`
      )
    }

    /**
     * Override `this.limit` setting as `null`
     */
    this.limit(null)

    // get the engine to paginate with
    const engine = this.engine()

    // paginate (query) the results
    const results = engine.paginate(this, page, limit)

    // get total count
    const total = engine.getTotalCount(results)

    return new LengthPaginator(results, total, page, limit)
  }

  /**
   * Paginate the given query after the cursor (forward only).
   *
   * @param {String} cursor
   * @param {Number} [limit = 20]
   */
  paginateAfter (cursor, limit = 10) {

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
