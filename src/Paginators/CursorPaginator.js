'use strict'

const CE = require('./Exceptions')
const { max, ceil } = require('lodash')
const proxyMethods = [
  'first',
  'nth',
  'last',
  'size',
  'toJSON'
]

class Paginator {
  /**
   * Cria uma nova instância da paginação.
   *
   * @param {Collection} items
   * @param {Number} currentPage
   * @param {Number} perPage
   * @param {Number} total
   */
  constructor (items, total, currentPage, perPage) {
    this.items = items
    this.total = total
    this.currentPage = currentPage
    this.perPage = perPage
    this.lastPage = max([1, ceil(total / perPage)])
  }


}

proxyMethods.forEach(method => {
  Paginator.prototype[method] = function (...params) {
    return this.items[method](...params)
  }
})

module.exports = Paginator
