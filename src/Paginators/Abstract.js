'use strict'

const proxyMethods = [
  'first',
  'nth',
  'last',
  'size',
  'toJSON'
]

class AbstractPaginator {
  /**
   * Cria uma nova instância da paginação.
   *
   * @param {Collection} items
   * @param {Number} currentPage
   * @param {Number} perPage
   * @param {Number} total
   */
  constructor (items, total, currentPage, perPage) {
    if (new.target === AbstractPaginator) {
      throw new TypeError('Cannot construct AbstractPaginator directly')
    }

    this.items = items
    this.total = total
    this.currentPage = currentPage
    this.perPage = perPage
  }
}

proxyMethods.forEach(method => {
  AbstractPaginator.prototype[method] = function (...params) {
    return this.items[method](...params)
  }
})

module.exports = AbstractPaginator
