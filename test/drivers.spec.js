'use strict'

describe('Drivers', () => {
  it('exports all driver implementations', () => {
    const ElasticsearchDriver = require('../src/Drivers/Elasticsearch')
    const NullDriver = require('../src/Drivers/Null')
    const Drivers = require('../src/Drivers')
    expect(Drivers.elasticsearch).toBe(ElasticsearchDriver)
    expect(Drivers.null).toBe(NullDriver)
  })
})
