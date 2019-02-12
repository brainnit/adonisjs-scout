'use strict'

const { ioc } = require('@adonisjs/fold')
const { Config, Env, setupResolver } = require('@adonisjs/sink')
const ScoutProvider = require('../providers/ScoutProvider')

beforeAll(() => {
  ioc.singleton('Adonis/Src/Env', () => new Env())
  ioc.alias('Adonis/Src/Env', 'Env')

  ioc.singleton('Adonis/Src/Config', function () {
    const config = new Config()
    config.set('scout', require('../config'))
    return config
  })
  ioc.alias('Adonis/Src/Config', 'Config')

  const provider = new ScoutProvider(ioc)
  provider.register()
  setupResolver()
})

describe('ScoutProvider', () => {
  it('Scout should be registered just fine', () => {
    const Scout = require('../src/Scout')
    expect(ioc.use('Adonis/Addons/Scout')).toBeInstanceOf(Scout)
    expect(ioc.use('Scout')).toBeInstanceOf(Scout)
  })

  it('Searchable should be registered just fine', () => {
    const Searchable = require('../src/Searchable')
    expect(ioc.use('Adonis/Traits/Searchable')).toBeInstanceOf(Searchable)
    expect(ioc.use('Searchable')).toBeInstanceOf(Searchable)
  })

  it('Scout should call engine manager to extend drivers', () => {
    const Scout = require('../src/Scout')
    const configMock = jest.fn()
    const managerMock = jest.fn()
    managerMock.extend = jest.fn()
    const scout = new Scout(configMock, managerMock)
    const driverMock = jest.fn()
    scout.extend('mock', driverMock)
    expect(managerMock.extend).toHaveBeenCalledWith('mock', driverMock)
  })
})
