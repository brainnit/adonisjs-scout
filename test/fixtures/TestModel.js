'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class TestModel extends Model {
  /**
   * Como os modelos só fazem `boot` uma vez, desativo manualmente
   * o booting do Modelo Abstrato.
   *
   * @method
   *
   * @return {Void}
   */
  static _bootIfNotBooted () {
    if (this.name !== 'TestModel') {
      super._bootIfNotBooted()
    }
  }

  static get traits () {
    return ['@provider:Searchable']
  }

  static get table () {
    return 'table'
  }
}

module.exports = TestModel
