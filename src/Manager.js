'use strict'

const { ioc } = require('@adonisjs/fold')
const Drivers = require('./Drivers')
const CE = require('./Exceptions')

class EngineManager {
  constructor () {
    this._drivers = {}
  }

  /**
   * Exposing api to be extend, IoC container will use this
   * method when someone tries to extend scout provider.
   *
   * @param {String} name
   * @param {Object} implementation
   */
  extend (name, implementation) {
    this._drivers[name] = implementation
  }

  /**
   * Returns an instance of the search engine driver.
   *
   * @param {String} name
   * @param {Object} config
   *
   * @return {*}
   */
  driver (name, config) {
    if (!name) {
      throw CE.InvalidArgumentException.invalidParameter(
        'Cannot get driver instance without a name'
      )
    }

    name = name.toLowerCase()
    const Driver = Drivers[name] || this._drivers[name]

    if (!Driver) {
      throw CE.InvalidArgumentException.invalidDriver(name)
    }

    const driverInstance = ioc.make(Driver)
    driverInstance.setConfig(config)

    return driverInstance
  }
}

module.exports = EngineManager
