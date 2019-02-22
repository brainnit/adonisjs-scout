'use strict'

const IndexKeeper = require('../../../src/IndexKeeper')

class TestIndexKeeper extends IndexKeeper {
  static get driver () {
    return 'null'
  }
}

module.exports = TestIndexKeeper
