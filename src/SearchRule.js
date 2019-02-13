'use strict'

const { LogicalException } = require('./Exceptions')

/**
 * @typedef {import('./Builder')} Builder
 */

class SearchRule {
  /**
   * @param {Builder} builder
   */
  constructor (builder) {
    if (new.target === SearchRule) {
      throw new TypeError('Cannot construct SearchRule directly')
    }
    this.builder = builder
  }

  buildQuery () {
    throw LogicalException.notImplementedMethod('buildQuery')
  }
}

module.exports = SearchRule
