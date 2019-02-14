'use strict'

require('@adonisjs/lucid/lib/iocResolver').setFold(require('@adonisjs/fold'))
const Model = require('@adonisjs/lucid/src/Lucid/Model')
const DatabaseManager = require('@adonisjs/lucid/src/Database/Manager')
const VanillaSerializer = require('@adonisjs/lucid/src/Lucid/Serializers/Vanilla')
const { ioc } = require('@adonisjs/fold')
const { Config, Env, setupResolver } = require('@adonisjs/sink')
const Builder = require('../src/Builder')
const setup = require('./fixtures/setup')

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

  await setup.setupTables(ioc.use('Database'))
})

afterAll(async () => {
  await setup.dropTables(ioc.use('Database'))
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

  it('getSearchableKeyName returns model primaryKey by default', () => {
    expect(ModelStub.getSearchableKeyName()).toEqual('id')
  })

  it('getSearchableKey returns model primaryKeyValue by default', () => {
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

  it('searchRaw calls engine searchRaw and return results directly', () => {
    //
  })
  it('searchableRules returns no search rules by default', () => {
    ModelStub._bootIfNotBooted()
    expect(ModelStub.searchableRules()).toEqual([])
  })

  it('searchableRules returns model supported rules when defined', () => {
    CustomRuleModelStub._bootIfNotBooted()
    expect(CustomRuleModelStub.searchableRules()).toEqual(['CustomRule'])
  })

  it('makeSearchable calls engine update method to index models', () => {
    const engineMock = jest.fn()
    engineMock.update = jest.fn()

    const modelMock = jest.fn()
    modelMock.searchableUsing = jest.fn(() => engineMock)

    const collection = new VanillaSerializer([modelMock])
    ioc.use('Searchable').constructor.makeSearchable(collection)

    expect(engineMock.update).toHaveBeenCalledWith(collection)
  })

  it('makeSearchable just returns if collection size is zero', () => {
    const collection = new VanillaSerializer([])
    collection.first = jest.fn()
    ioc.use('Searchable').constructor.makeSearchable(collection)
    expect(collection.first).not.toHaveBeenCalled()
  })

  it('makeUnsearchable calls engine update method to remove models from index', () => {
    const engineMock = jest.fn()
    engineMock.delete = jest.fn()

    const modelMock = jest.fn()
    modelMock.searchableUsing = jest.fn(() => engineMock)

    const collection = new VanillaSerializer([ modelMock ])
    ioc.use('Searchable').constructor.makeUnsearchable(collection)

    expect(engineMock.delete).toHaveBeenCalledWith(collection)
  })

  it('makeUnsearchable just returns if collection size is zero', () => {
    const collection = new VanillaSerializer([])
    collection.first = jest.fn()
    ioc.use('Searchable').constructor.makeUnsearchable(collection)
    expect(collection.first).not.toHaveBeenCalled()
  })

  it('searchableUsing returns engine from Scout', () => {
    const engineMock = jest.fn()
    const scoutMock = jest.fn()
    scoutMock.engine = () => engineMock
    ioc.fake('Scout', () => scoutMock)
    const model = new ModelStub()
    expect(model.searchableUsing()).toBe(engineMock)
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

class CustomRuleModelStub extends Model {
  static get traits () {
    return ['@provider:Searchable']
  }

  static searchableRules () {
    return ['CustomRule']
  }
}
