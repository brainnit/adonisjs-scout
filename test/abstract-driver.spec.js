'use strict'

require('dotenv').load()
const AbstractDriver = require('../src/Drivers/Abstract')
const { LogicalException } = require('../src/Exceptions')

describe('AbstractDriver', () => {
  it('throws exception if constructed', () => {
    const fn = () => { return new AbstractDriver() }
    expect(fn).toThrow(TypeError)
  })

  it('methods throw exception if not implemented', () => {
    const stubDriver = new StubDriver()
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
})

class StubDriver extends AbstractDriver {}
