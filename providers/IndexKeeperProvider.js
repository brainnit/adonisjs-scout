'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class IndexKeeperProvider extends ServiceProvider {
  /**
   * Regsiter namespaces on IoC container.
   *
   * @method register
   *
   * @return {Elasticsearch}
   */
  register () {
    this._registerIndexKeeper()
    this._registerCommands()
  }

  /**
   * Register index keeper provider under `Adonis/Addons/Scout/IndexKeeper`
   * namespace and creates an alias named `Scout/IndexKeeper`.
   *
   * @method _registerIndexKeeper
   *
   * @return {void}
   *
   * @private
   */
  _registerIndexKeeper () {
    this.app.bind('Adonis/Addons/Scout/IndexKeeper', () => {
      return require('../src/IndexKeeper')
    })
    this.app.alias('Adonis/Addons/Scout/IndexKeeper', 'Scout/IndexKeeper')
  }

  /**
   * Registers providers for all commands related to index keeper.
   *
   * @method _registerCommands
   *
   * @return {void}
   */
  _registerCommands () {
    this.app.bind('Adonis/Commands/Scout:IndexUp', () => {
      return require('../src/Commands/IndexUp')
    })
    this.app.bind('Adonis/Commands/Scout:IndexDown', () => {
      return require('../src/Commands/IndexDown')
    })
    this.app.bind('Adonis/Commands/Scout:Import', () => {
      return require('../src/Commands/Import')
    })
    this.app.bind('Adonis/Commands/Scout:Flush', () => {
      return require('../src/Commands/Flush')
    })
  }

  /**
   * On boot add commands with ace
   *
   * @method boot
   *
   * @return {void}
   */
  boot () {
    const ace = require('@adonisjs/ace')
    ace.addCommand('Adonis/Commands/Scout:IndexUp')
    ace.addCommand('Adonis/Commands/Scout:IndexDown')
    ace.addCommand('Adonis/Commands/Scout:Import')
    ace.addCommand('Adonis/Commands/Scout:Flush')
  }
}

module.exports = IndexKeeperProvider
