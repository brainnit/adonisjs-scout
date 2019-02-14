'use strict'

const TestModel = require('./TestModel')

class ElasticsearchTestModel extends TestModel {
  static get traits () {
    return ['@provider:Searchable']
  }

  static get table () {
    return 'table'
  }
}

module.exports = ElasticsearchTestModel
