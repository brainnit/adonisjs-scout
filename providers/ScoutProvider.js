'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class ScoutProvider extends ServiceProvider {
  /**
   * Register namespaces on IoC container.
   *
   * @method register
   *
   * @return {Elasticsearch}
   */
  register () {
    this._registerScout()
    this._registerEngineManager()
    this._registerSearchableTrait()
    this._registerSearchRule()
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
    this.app.manager('Adonis/Addons/Scout', this.app.use('Scout'))
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
    this.app.bind('Adonis/Traits/Searchable', () => {
      const Searchable = require('../src/Searchable')
      return new Searchable()
    })
    this.app.alias('Adonis/Traits/Searchable', 'Searchable')
  }

  /**
   * Register search rule class.
   *
   * @method _registerSearchRule
   *
   * @return {void}
   *
   * @private
   */
  _registerSearchRule () {
    this.app.bind('Adonis/Addons/Scout/SearchRule', () => {
      return require('../src/SearchRule')
    })
    this.app.alias('Adonis/Addons/Scout/SearchRule', 'Scout/SearchRule')
  }
}

module.exports = ScoutProvider
