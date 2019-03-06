'use strict'

const EngineManager = require('./Manager')
const CE = require('./Exceptions')
const proxyMethods = [
  'update',
  'delete',
  'search',
  'paginate',
  'mapIds',
  'map',
  'getTotalCount'
]

class Scout {
  constructor (Config, Manager = new EngineManager()) {
    this.Config = Config
    this.Manager = Manager
    this._enginesPool = {}
  }

  /**
   * Forward extension to Engine Manager.
   *
   * @param {String} name Driver name
   * @param {Object} implementation Driver implementation
   *
   * @return {void}
   */
  extend (name, implementation) {
    this.Manager.extend(name, implementation)
  }

  /**
   * Returns an instance of search engine. Also this method
   * will cache the instance for re-usability.
   *
   * @method connection
   *
   * @param  {String}   name
   *
   * @return {Object}
   */
  engine (name) {
    name = name || this.Config.get('scout.driver')

    /**
     * Returns the cached engine instance if exists
     */
    if (this._enginesPool[name]) {
      return this._enginesPool[name]
    }

    /**
     * Cannot get default connection
     */
    if (!name) {
      throw CE.InvalidArgumentException.invalidParameter(
        'Make sure to define connection inside config/scout.js file'
      )
    }

    const engineConfig = this.Config.get(`scout.${name.toLowerCase()}`)

    /**
     * Cannot get config for the defined engine
     */
    if (!engineConfig) {
      throw CE.RuntimeException.missingConfig(name)
    }

    this._enginesPool[name] = this.Manager.driver(name, engineConfig)

    return this._enginesPool[name]
  }
}

proxyMethods.forEach(method => {
  Scout.prototype[method] = function (...params) {
    return this.engine()[method](...params)
  }
})

module.exports = Scout
