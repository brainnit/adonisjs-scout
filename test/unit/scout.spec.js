'use strict'

const { Config } = require('@adonisjs/sink')
const Scout = require('../../src/Scout')
const NullDriver = require('../../src/Drivers').null

describe('Scout', () => {
  it('throw exception when unable to find engine', () => {
    const config = new Config()
    const scout = new Scout(config)
    const fn = () => scout.engine()
    expect(fn).toThrow('E_INVALID_PARAMETER: Make sure to define connection inside config/scout.js file')
  })

  it('throw exception when engine config is missing', () => {
    const config = new Config()
    config.set('scout.driver', 'elasticsearch')
    const scout = new Scout(config)
    const fn = () => scout.engine()
    expect(fn).toThrow('E_MISSING_CONFIG: elasticsearch is not defined inside config/scout.js file')
  })

  it('get null driver instance', () => {
    const config = new Config()
    config.set('scout.driver', 'null')
    config.set('scout.null', {
      foo: 'bar'
    })
    const scout = new Scout(config)
    const driverInstance = scout.engine()

    expect(driverInstance).toBeInstanceOf(NullDriver)
  })

  it('return the cached instance if exists', () => {
    const config = new Config()
    config.set('scout.driver', 'null')
    config.set('scout.null', {
      foo: 'bar'
    })
    const scout = new Scout(config)
    const engine1 = scout.engine('null')
    const engine2 = scout.engine('null')
    expect(engine2).toBe(engine1)
  })

  it('proxy sender methods', () => {
    const config = new Config()
    config.set('scout.driver', 'null')
    config.set('scout.null', {
      foo: 'bar'
    })
    const scout = new Scout(config)

    expect(typeof scout.update).toBe('function')
    expect(typeof scout.delete).toBe('function')
    expect(typeof scout.search).toBe('function')
    expect(typeof scout.paginate).toBe('function')
    expect(typeof scout.mapIds).toBe('function')
    expect(typeof scout.map).toBe('function')
    expect(typeof scout.getTotalCount).toBe('function')
  })
})
