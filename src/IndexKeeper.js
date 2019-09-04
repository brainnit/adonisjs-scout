'use_strict'

const proxyMethods = [
  'createIndex',
  'deleteIndex'
]

class IndexKeeper {
  constructor (Scout) {
    this.engine = Scout.engine(this.constructor.driver)
    this.prefix = Scout.Config.prefix
  }

  /**
   * IoC container injections.
   *
   * @method inject
   *
   * @return {Array}
   */
  static get inject () {
    return ['Adonis/Addons/Scout']
  }

  /**
   * Get the engine driver to be used.
   *
   * If null is given, the default engine driver will be used.
   *
   * @return {Null|String}
   */
  static get driver () {
    return null
  }

  /**
   * This method will be called to create the index.
   *
   * @return {Promise}
   */
  up () {
    // ...
  }

  /**
   * This method will be called to drop the index.
   *
   * @return {Promise}
   */
  down () {
    // ...
  }
}

proxyMethods.forEach(method => {
  IndexKeeper.prototype[method] = function (index, ...params) {
    return this.engine[method](`${this.prefix}${index}`, ...params)
  }
})

module.exports = IndexKeeper
