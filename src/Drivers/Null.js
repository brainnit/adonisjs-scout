'use strict'

const AbstractDriver = require('./Abstract')

class NullDriver extends AbstractDriver {
  constructor () {
    super()
    console.log('NullDriver is being used')
  }

  setConfig (config) {
    //
  }
}

module.exports = NullDriver
