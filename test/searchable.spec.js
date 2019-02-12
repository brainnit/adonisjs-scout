'use strict'

require('@adonisjs/lucid/lib/iocResolver').setFold(require('@adonisjs/fold'))
const Model = require('@adonisjs/lucid/src/Lucid/Model')
const DatabaseManager = require('@adonisjs/lucid/src/Database/Manager')
const VanillaSerializer = require('@adonisjs/lucid/src/Lucid/Serializers/Vanilla')
const { ioc } = require('@adonisjs/fold')
const { Config, Env, setupResolver } = require('@adonisjs/sink')
const Builder = require('../src/Builder')
const fixtures = require('./helpers/fixtures')

beforeAll(async () => {
  ioc.singleton('Adonis/Src/Env', () => new Env())
  ioc.alias('Adonis/Src/Env', 'Env')

  ioc.singleton('Adonis/Src/Config', function () {
    const config = new Config()
    config.set('scout', require('../config'))
    return config
  })
  ioc.alias('Adonis/Src/Config', 'Config')

  ioc.singleton('Adonis/Src/Database', function () {
    const config = ioc.use('Config')
    config.set('database', {
      connection: 'sqlite',
      sqlite: {
        client: 'sqlite3',
        connection: {
          filename: './testing.sqlite'
        },
        useNullAsDefault: true,
        debug: false
      }
    })
    return new DatabaseManager(config)
  })
  ioc.alias('Adonis/Src/Database', 'Database')

  ioc.singleton('Adonis/Addons/Scout', () => {
    const Config = ioc.use('Adonis/Src/Config')
    const Scout = require('../src/Scout')
    return new Scout(Config)
  })
  ioc.alias('Adonis/Addons/Scout', 'Scout')

  ioc.bind('Adonis/Src/Model', () => Model)
  ioc.alias('Adonis/Src/Model', 'Model')

  ioc.bind('Adonis/Traits/Searchable', () => {
    const Searchable = require('../src/Searchable')
    return new Searchable()
  })
  ioc.alias('Adonis/Traits/Searchable', 'Searchable')

  setupResolver()

  await fixtures.setupTables(ioc.use('Database'))
})

afterAll(async () => {
  await fixtures.dropTables(ioc.use('Database'))
})

afterEach(async () => {
  await ioc.use('Database').table('stubs').truncate()
})

describe('Searchable', () => {
  it('searchableAs returns model table', () => {
    const model = new ModelStub()
    ModelStub._bootIfNotBooted()
    expect(model.searchableAs()).toBe('stubs')
  })

  it('searchableAs returns prefixed model table', () => {
    const model = new ModelStub()
    ModelStub._bootIfNotBooted()
    ioc.use('Config').set('scout.prefix', 'prefix_')
    expect(model.searchableAs()).toBe('prefix_stubs')
  })

  it('shouldBeSearchable returns true by default', () => {
    const model = new ModelStub()
    ModelStub._bootIfNotBooted()
    expect(model.shouldBeSearchable()).toBe(true)
  })

  it('getSearchableKey returns model primaryKey by default', () => {
    const model = new ModelStub()
    ModelStub._bootIfNotBooted()
    model.newUp({ id: 1 })
    expect(model.getSearchableKey()).toEqual(1)
  })

  it('searchable hooks are added by default', () => {
    ModelStub._bootIfNotBooted()
    expect(ModelStub.$hooks.after._handlers.save.length).toBe(1)
    expect(ModelStub.$hooks.after._handlers.delete.length).toBe(1)
  })

  it('searchable hooks are NOT added if autoSync is disabled', () => {
    AutoSyncDisabledModelStub._bootIfNotBooted()
    expect(AutoSyncDisabledModelStub.$hooks.after._handlers).toEqual({})
  })

  it('search returns builder instance', () => {
    ModelStub._bootIfNotBooted()
    expect(ModelStub.search()).toBeInstanceOf(Builder)
  })

  it('searchable calls engine to add models to search index', async () => {
    expect.assertions(1)
    ModelStub._bootIfNotBooted()

    const collection = {}
    collection.size = jest.fn(() => 1)
    collection.first = jest.fn(() => {
      return {
        searchableUsing: jest.fn(() => {
          return {
            update: jest.fn(models => {
              expect(models).toEqual(collection)
            })
          }
        })
      }
    })

    ioc.use('Searchable').constructor.makeSearchable(collection)
  })

  it.skip('unsearchable removes model from the index', () => {
    const model = new ModelStub()
    ModelStub._bootIfNotBooted()
    model.newUp({ id: 1 })
    model.unsearchable()
    expect(1).toBe(1)
  })
})

class ModelStub extends Model {
  static get traits () {
    return ['@provider:Searchable']
  }

  static get table () {
    return 'stubs'
  }
}

class AutoSyncDisabledModelStub extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:Searchable', { autoSync: false })
  }

  static get table () {
    return 'otherstubs'
  }
}
