'use strict'

const ace = require('@adonisjs/ace')
const fs = require('fs-extra')
const path = require('path')
const { ioc, registrar } = require('@adonisjs/fold')
const { Config, setupResolver, Helpers } = require('@adonisjs/sink')
const setup = require('../unit/fixtures/setup')

const Flush = require('../../src/Commands/Flush')

beforeAll(async () => {
  ioc.singleton('Adonis/Src/Config', function () {
    const config = new Config()

    config.set('database', {
      connection: 'sqlite',
      sqlite: {
        client: 'sqlite',
        connection: {
          filename: path.join(__dirname, '../tmp/testing.sqlite3')
        }
      }
    })

    config.set('scout', {
      driver: 'null',
      null: {}
    })

    return config
  })
  ioc.alias('Adonis/Src/Config', 'Config')

  ioc.bind('Adonis/Src/Helpers', () => {
    return new Helpers(path.join(__dirname))
  })

  const eventMock = jest.fn()
  eventMock.on = jest.fn()
  eventMock.emit = jest.fn()
  eventMock.removeListener = jest.fn()

  ioc.bind('Adonis/Src/Event', () => eventMock)
  ioc.alias('Adonis/Src/Event', 'Event')

  await registrar
    .providers([
      '@adonisjs/lucid/providers/LucidProvider',
      path.join(__dirname, '../../providers/ScoutProvider'),
      path.join(__dirname, '../../providers/IndexKeeperProvider')
    ])
    .registerAndBoot()

  await fs.ensureDir(path.join(__dirname, '../tmp'))
  await fs.ensureDir(path.join(__dirname, 'app/Models'))

  await setup.setupTables(ioc.use('Database'))

  setupResolver()
})

afterEach(async () => {
  await setup.truncateTables(ioc.use('Database'))
})

afterAll(async () => {
  await setup.dropTables(ioc.use('Database'))
  ioc.use('Database').close()

  try {
    await fs.remove(path.join(__dirname, '../tmp'))
    await fs.remove(path.join(__dirname, 'app'))
  } catch (error) {
    if (process.platform !== 'win32' || error.code !== 'EBUSY') {
      throw error
    }
  }
}, 0)

describe('Flush Command', () => {
  it('skip when no Model class is given', async () => {
    ace.addCommand(Flush)
    const result = await ace.call('scout:flush')
    expect(result).toEqual('Nothing to do')
  })

  it('flush models', async () => {
    ace.addCommand(Flush)

    jest.spyOn(console, 'log')

    const TestModel = require('../unit/fixtures/TestModel')
    TestModel._bootIfNotBooted()

    ioc.bind('App/Models/TestModel', () => TestModel)

    await ioc.use('Database').table('stubs').insert([
      { title: 'foo' },
      { title: 'bar' },
      { title: 'foobar' }
    ])

    await ace.call('scout:flush', { model: 'TestModel' })

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('All TestModel models were flushed')
    )
  })
})
