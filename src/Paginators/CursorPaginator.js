'use strict'

const AbstractPaginator = require('./Abstract')
const { Base64 } = require('js-base64')

class CursorPaginator extends AbstractPaginator {
  /**
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

    /**
     * Check if there are more items than than set on `perPage`.
     * If yes, it means we have more items forward to paginate to
     * and we should drop the last item.
     */
    if (this.isEmpty() === false && this.count() > perPage) {
      this.$paginator.items.rows = this.$paginator.items.rows.slice(0, -1)
      this.$paginator.hasMore = true
    } else {
      this.$paginator.hasMore = false
    }

    this.$paginator.cursor = cursor
    this.$paginator.cursorColumns = []
    this.$paginator.perPage = perPage
  }

  /**
   * Set current cursor columns.
   *
   * @param {Array} columns
   *
   * @return {void}
   */
  setCursorColumns (columns) {
    this.$paginator.cursorColumns = columns
  }

  /**
   * Get the current page.
   *
   * @return {Number}
   */
  get cursor () {
    return this.$paginator.cursor
  }

  /**
   * Get the current cursor columns.
   *
   * @return {Number}
   */
  get cursorColumns () {
    return this.$paginator.cursorColumns
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
   * Determine if there is a previous page.
   *
   * @return {Boolean}
   */
  hasPreviousPage () {
    return !!this.$paginator.cursor
  }

  /**
   * Determine if there are more items in the data source.
   *
   * @return {Boolean}
   */
  hasNextPage () {
    return !!this.$paginator.hasMore
  }

  /**
   * Get the cursor of the first item.
   *
   * @return {String}
   */
  startCursor () {
    return this.constructor.encodeCursor(
      this.getCollection().first().getSearchableCursor(this.cursorColumns)
    )
  }

  /**
   * Get the cursor of the last item.
   *
   * @return {String}
   */
  endCursor () {
    return this.constructor.encodeCursor(
      this.getCollection().last().getSearchableCursor(this.cursorColumns)
    )
  }

  /**
   * Encode the cursor to make it opaque.
   *
   * @param {*} cursor
   *
   * @return {String}
   */
  static encodeCursor (cursor) {
    return Base64.encode(JSON.stringify(cursor))
  }

  /**
   * Decode the cursor to its original form.
   *
   * @param {String} cursor
   *
   * @return {*}
   */
  static decodeCursor (cursor) {
    return JSON.parse(Base64.decode(cursor))
  }

  /**
   * Convert items to its JSON representation as `edges`.
   *
   * @return {Object}
   */
  toEdgesJSON () {
    return this.items.map(modelInstance => ({
      node: this.getCollection()._getRowJSON(modelInstance),
      cursor: this.constructor.encodeCursor(
        modelInstance.getSearchableCursor(this.cursorColumns)
      )
    }))
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
      totalCount: this.$paginator.total,
      edges: this.toEdgesJSON(),
      pageInfo: {
        hasPreviousPage: this.hasPreviousPage(),
        hasNextPage: this.hasNextPage(),
        startCursor: this.startCursor(),
        endCursor: this.endCursor()
      }
    }
  }
}

module.exports = CursorPaginator
