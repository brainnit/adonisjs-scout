'use strict'

const EngineManager = require('../../src/Manager')
const NullDriver = require('../../src/Drivers').null

describe('EngineManager', () => {
  it('throw exception when invalid driver name is passed', () => {
    const fn = () => (new EngineManager()).driver('foo', {})
    expect(fn).toThrow('E_INVALID_DRIVER: foo is not a valid search engine driver')
  })

  it('throw exception when driver name is missing', () => {
    const fn = () => (new EngineManager()).driver('', {})
    expect(fn).toThrow('E_INVALID_PARAMETER: Cannot get driver instance without a name')
  })

  it('get instance of existing driver', () => {
    const driver = (new EngineManager()).driver('null', {})
    expect(driver).toBeInstanceOf(NullDriver)
  })

  it('extend adds driver to known drivers list', () => {
    const manager = new EngineManager()
    const driverMock = jest.fn()
    manager.extend('drivermock', driverMock)
    expect(manager._drivers['drivermock']).toEqual(driverMock)
  })
})
