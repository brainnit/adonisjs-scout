'use strict'

const AbstractPaginator = require('./Abstract')
const { max, ceil } = require('lodash')

class LengthAwarePaginator extends AbstractPaginator {
  /**
   * @param {Collection} items
   * @param {Number} total
   * @param {Number} currentPage
   * @param {Number} perPage
   */
  constructor (items, total, currentPage, perPage) {
    /**
     * Super constructor will set `items` and `total`
     * under `this.$paginator` namespace.
     */
    super(items, total)

    this.$paginator.currentPage = currentPage
    this.$paginator.perPage = perPage
    this.$paginator.lastPage = max([1, ceil(total / perPage)])
  }

  /**
   * Get the current page.
   *
   * @return {Number}
   */
  get currentPage () {
    return this.$paginator.currentPage
  }

  /**
   * Get the number of items shown per page.
   *
   * @return {Number}
   */
  get perPage () {
    return this.$paginator.perPage
  }

  /**
   * Get the last page.
   *
   * @return {Number}
   */
  get lastPage () {
    return this.$paginator.lastPage
  }

  /**
   * Determine if the paginator is on the first page.
   *
   * @return {Boolean}
   */
  onFirstPage () {
    return this.$paginator.currentPage <= 1
  }

  /**
   * Determine if the paginator is on the last page.
   *
   * @return {Boolean}
   */
  onLastPage () {
    return this.$paginator.currentPage === this.lastPage
  }

  /**
   * Determine if there is a previous page.
   *
   * @return {Boolean}
   */
  hasPreviousPage () {
    return this.onFirstPage() === false
  }

  /**
   * Determine if there are more items in the data source.
   *
   * @return {Boolean}
   */
  hasNextPage () {
    return this.$paginator.currentPage < this.lastPage
  }

  /**
   * Convert the paginator instance to its JSON representation,
   * exporting `total` and items `data`.
   *
   * @method toJSON
   *
   * @return {Object}
   */
  toJSON () {
    return {
      total: this.$paginator.total,
      perPage: this.$paginator.perPage,
      lastPage: this.$paginator.lastPage,
      currentPage: this.$paginator.currentPage,
      hasPreviousPage: this.hasPreviousPage(),
      hasNextPage: this.hasNextPage(),
      data: this.$paginator.items.toJSON()
    }
  }
}

module.exports = LengthAwarePaginator
