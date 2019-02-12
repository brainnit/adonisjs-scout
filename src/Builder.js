'use strict'

class Builder {
  constructor (query = null, callback = null) {
    this.query = query
    this.callback = callback
  }
}

module.exports = Builder
