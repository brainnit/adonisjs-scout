'use strict'

const { ioc } = require('@adonisjs/fold')
const { Config, Env, setupResolver } = require('@adonisjs/sink')
const IndexKeeperProvider = require('../../providers/IndexKeeperProvider')

beforeAll(() => {
  ioc.singleton('Adonis/Src/Env', () => new Env())
  ioc.alias('Adonis/Src/Env', 'Env')

  ioc.singleton('Adonis/Src/Config', function () {
    const config = new Config()
    config.set('scout', require('../../config'))
    return config
  })
  ioc.alias('Adonis/Src/Config', 'Config')

  ioc.singleton('Adonis/Addons/Scout', (app) => {
    const Config = app.use('Adonis/Src/Config')
    const Scout = require('../../src/Scout')
    return new Scout(Config)
  })
  ioc.alias('Adonis/Addons/Scout', 'Scout')

  const provider = new IndexKeeperProvider(ioc)
  provider.register()

  setupResolver()
})

describe('IndexKeeperProvider', () => {
  it('IndexKeeper should be registered just fine', () => {
    const IndexKeeper = require('../../src/IndexKeeper')
    expect(ioc.use('Adonis/Addons/Scout/IndexKeeper')).toEqual(IndexKeeper)
    expect(ioc.use('Scout/IndexKeeper')).toEqual(IndexKeeper)
  })
})
