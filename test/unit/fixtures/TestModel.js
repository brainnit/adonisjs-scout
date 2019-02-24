'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class TestModel extends Model {
  static get traits () {
    return ['@provider:Searchable']
  }

  static get table () {
    return 'stubs'
  }
}

module.exports = TestModel
