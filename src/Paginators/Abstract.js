'use strict'

const proxyMethods = ['first', 'last', 'size']

class AbstractPaginator {
  /**
   * Cria uma nova instância da paginação.
   *
   * @throws TypeError
   *
   * @param {Collection} items
   * @param {Number} currentPage
   * @param {Number} perPage
   * @param {Number} total
   */
  constructor (items, total) {
    if (new.target === AbstractPaginator) {
      throw new TypeError('Cannot construct AbstractPaginator directly')
    }

    this.$paginator = {}
    this.$paginator.items = items
    this.$paginator.total = total
  }

  /**
   * Get the items collection.
   *
   * @return {Collection}
   */
  getCollection () {
    return this.$paginator.items
  }

  /**
   * Get the slice of items being paginated.
   *
   * @return {Array}
   */
  get items () {
    return this.$paginator.items.rows
  }

  /**
   * Get the total number of results.
   *
   * @return {Number}
   */
  get total () {
    return this.$paginator.total
  }

  /**
   * Determine if the list of items is empty.
   *
   * @return {Boolean}
   */
  isEmpty () {
    return this.$paginator.items.size() === 0
  }

  /**
   * Get the number of items for the current page.
   *
   * @alias size
   *
   * @return {Number}
   */
  count () {
    return this.$paginator.items.size()
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
      data: this.$paginator.items.toJSON()
    }
  }
}

proxyMethods.forEach(method => {
  AbstractPaginator.prototype[method] = function (...params) {
    return this.items[method](...params)
  }
})

module.exports = AbstractPaginator
