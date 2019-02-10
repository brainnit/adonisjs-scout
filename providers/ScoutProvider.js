'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class ScoutProvider extends ServiceProvider {
  /**
   * Registra namespaces no IoC container.
   *
   * @method register
   *
   * @return {Elasticsearch}
   */
  register () {
    this._registerScout()
    this._registerEngineManager()
    this._registerSearchableTrait()
  }

  /**
   * Register scout provider under `Adonis/Addons/Scout`
   * namespace and an alias named `Scout`.
   *
   * @method _registerScout
   *
   * @return {void}
   *
   * @private
   */
  _registerScout () {
    this.app.singleton('Adonis/Addons/Scout', (app) => {
      const Config = app.use('Adonis/Src/Config')
      const Scout = require('../src/Scout')
      return new Scout(Config)
    })
    this.app.alias('Adonis/Addons/Scout', 'Scout')
  }

  /**
   * Register mail manager to expose the API to get extended.
   *
   * @method _registerEngineManager
   *
   * @return {void}
   *
   * @private
   */
  _registerEngineManager () {
    this.app.manager('Adonis/Addons/Scout', require('../src/Manager'))
  }

  /**
   * Register searchable trait under `Adonis/Traits/Searchable` namespace
   * and creates an alias named `Searchable`.
   *
   * Supposed to be used to make your Lucid models searchable.
   *
   * @method _registerSearchableTrait
   *
   * @return {void}
   *
   * @private
   */
  _registerSearchableTrait () {
    this.app.bind('Adonis/Traits/Searchable', () =>
      require('../src/Searchable'))
    this.app.alias('Adonis/Traits/Searchable', 'Searchable')
  }
}

module.exports = ScoutProvider
