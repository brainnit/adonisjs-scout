'use strict'

const AbstractPaginator = require('./Abstract')

class CursorPaginator extends AbstractPaginator {
  /**
   * Cria uma nova instância da paginação.
   *
   * @param {Collection} items
   * @param {Number} total
   * @param {String} cursor
   * @param {Number} perPage
   */
  constructor (items, total, cursor, perPage) {
    /**
     * Super constructor will set `items` and `total`
     * under `this.$paginator` namespace.
     */
    super(items, total)

    this.$paginator.cursor = cursor
    this.$paginator.perPage = perPage
  }
}

module.exports = CursorPaginator
