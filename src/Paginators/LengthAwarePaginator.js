'use strict'

const AbstractPaginator = require('./Abstract')
const { max, ceil } = require('lodash')

class LengthAwarePaginator extends AbstractPaginator {
  /**
   * Cria uma nova instância da paginação.
   *
   * @param {Collection} items
   * @param {Number} currentPage
   * @param {Number} perPage
   * @param {Number} total
   */
  constructor (items, total, currentPage, perPage) {
    /**
     * Super constructor will set items, total, currentPage,
     * perPage and lastPage.
     */
    super(items, total, currentPage, perPage)

    this.lastPage = max([1, ceil(total / perPage)])
  }
}

module.exports = LengthAwarePaginator
