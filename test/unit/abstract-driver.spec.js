'use strict'

require('dotenv').load()
const AbstractDriver = require('../../src/Drivers/Abstract')
const TestDriver = require('./fixtures/TestDriver')
const Builder = require('../../src/Builder')
const GlobalSearchableScopes = require('../../src/GlobalSearchableScopes')
const { LogicalException } = require('../../src/Exceptions')

describe('AbstractDriver', () => {
  it('throws exception if constructed', () => {
    const fn = () => { return new AbstractDriver() }
    expect(fn).toThrow(TypeError)
  })

  it('methods throw exception if not implemented', () => {
    const stubDriver = new TestDriver()
    expect(() => stubDriver.setConfig()).toThrow(LogicalException)
    expect(() => stubDriver.update()).toThrow(LogicalException)
    expect(() => stubDriver.delete()).toThrow(LogicalException)
    expect(() => stubDriver.search()).toThrow(LogicalException)
    expect(() => stubDriver.paginate()).toThrow(LogicalException)
    expect(() => stubDriver.mapIds()).toThrow(LogicalException)
    expect(() => stubDriver.map()).toThrow(LogicalException)
    expect(() => stubDriver.getTotalCount()).toThrow(LogicalException)
    expect(() => stubDriver.flush()).toThrow(LogicalException)
  })

  it('keys calls search and subsequently calls mapId with the results', () => {
    expect.assertions(2)

    const stubDriver = new TestDriver()

    const builder = jest.fn()
    builder.model = jest.fn()

    const results = { foo: 'bar' }

    stubDriver.search = jest.fn(() => {
      return new Promise((resolve) => {
        resolve(results)
      })
    })

    stubDriver.mapIds = jest.fn((a) => {
      expect(a).toEqual(results)
    })

    stubDriver.keys(builder)

    expect(stubDriver.search).toHaveBeenCalledWith(builder)
  })

  it('get calls search and subsequently calls map with the results', () => {
    expect.assertions(4)

    const stubDriver = new TestDriver()

    const builder = jest.fn()
    builder.model = jest.fn()

    const results = { foo: 'bar' }

    stubDriver.search = jest.fn(() => {
      return new Promise((resolve) => {
        resolve(results)
      })
    })

    stubDriver.map = jest.fn((a, b, c) => {
      expect(a).toBe(builder)
      expect(b).toEqual(results)
      expect(c).toBe(builder.model)
    })

    stubDriver.get(builder)

    expect(stubDriver.search).toHaveBeenCalledWith(builder)
  })

  it('cursors returns all columns being ordered', () => {
    const builder = new Builder(new ModelStub())
    builder.orderBy('foo', 'asc')
    builder.orderBy('bar', 'desc')

    const stubDriver = new TestDriver()
    const cursors = stubDriver.cursors(builder)

    expect(cursors).toEqual(['foo', 'bar'])
  })
})

class ModelStub {
  static get $globalSearchableScopes () {
    return new GlobalSearchableScopes()
  }
}
