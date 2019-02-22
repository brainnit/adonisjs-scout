'use strict'

const AbstractDriver = require('../../src/Drivers/Abstract')
const NullDriver = require('../../src/Drivers').null

describe('NullDriver', () => {
  it('null driver should be an instanceof abstract driver', () => {
    const driver = new NullDriver()
    expect(driver).toBeInstanceOf(AbstractDriver)
  })
})
