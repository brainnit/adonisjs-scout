'use strict'

const { ioc } = require('@adonisjs/fold')
const { Macroable } = require('macroable')
const Promise = require('bluebird')
const LengthPaginator = require('./Paginators/LengthAwarePaginator')
const CursorPaginator = require('./Paginators/CursorPaginator')
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
   * Set the "limit" for the search query.
   *
   * @alias take
   *
   * @param {Number} limit
   *
   * @return {Builder} this
   */
  limit (limit) {
    return this.take(limit)
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
  paginate (page = 1, limit = 20) {
    /**
     * Make sure `page` and `limit` are both integers.
     */
    if (Number.isInteger(page) === false || Number.isInteger(limit) === false) {
      throw CE.InvalidArgumentException.invalidParameter(
        `Both page and limit must an integer`
      )
    }

    this.take(null)
    const engine = this.engine()

    return engine.paginate(this, page, limit).then(
      rawResults => {
        return Promise.all([
          engine.map(this, rawResults, this.model),
          engine.getTotalCount(rawResults)
        ]).spread((results, total) => {
          return new LengthPaginator(results, total, page, limit)
        })
      }
    )
  }

  /**
   * Paginate the given query after the given cursor (forward only).
   *
   * @param {String} cursor (opaque)
   * @param {Number} [limit = 20]
   */
  paginateAfter (cursor = null, limit = 20) {
    /**
     * Make sure `limit` is integer.
     */
    if (Number.isInteger(limit) === false) {
      throw CE.InvalidArgumentException.invalidParameter(
        `Limit must an integer`
      )
    }

    this.take(null)
    const engine = this.engine()

    /**
     * Enforce default sorting if none given.
     * This is required to build cursors and be prepared for pagination.
     */
    if (this.orders.length === 0) {
      this.orderBy(this.model.constructor.getSearchableKeyName())
    }

    const decodedCursor = cursor ? CursorPaginator.decodeCursor(cursor) : null

    return engine.paginateAfter(this, decodedCursor, limit + 1).then(
      rawResults => {
        return Promise.all([
          engine.map(this, rawResults, this.model),
          engine.getTotalCount(rawResults),
          engine.cursors(this)
        ]).spread((results, total, cursorColumns) => {
          const paginator = new CursorPaginator(results, total, cursor, limit)
          paginator.setCursorColumns(cursorColumns)
          return paginator
        })
      }
    )
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
