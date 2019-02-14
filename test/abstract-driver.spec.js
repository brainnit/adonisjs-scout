'use strict'

require('dotenv').load()
const AbstractDriver = require('../src/Drivers/Abstract')
const TestDriver = require('./fixtures/TestDriver')
const { LogicalException } = require('../src/Exceptions')

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

  it('get calls search and subsequently calls map with promise results', () => {
    expect.assertions(4)

    const stubDriver = new TestDriver()
    jest.spyOn(stubDriver, 'get')

    const builder = jest.fn()
    builder.model = jest.fn()

    stubDriver.search = jest.fn(() => {
      return new Promise((resolve) => {
        resolve([])
      })
    })

    stubDriver.map = jest.fn((a, b, c) => {
      expect(a).toBe(builder)
      expect(b).toEqual([])
      expect(c).toBe(builder.model)
    })

    stubDriver.get(builder)

    expect(stubDriver.search).toHaveBeenCalledWith(builder)
  })
})
