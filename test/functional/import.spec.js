'use strict'

const ace = require('@adonisjs/ace')
const fs = require('fs-extra')
const path = require('path')
const { ioc, registrar } = require('@adonisjs/fold')
const { Config, setupResolver, Helpers } = require('@adonisjs/sink')

const Import = require('../../src/Commands/Import')

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

  await fs.ensureDir(path.join(__dirname, 'app/Models'))

  await registrar
    .providers([
      '@adonisjs/lucid/providers/LucidProvider.js',
      path.join(__dirname, '../../providers/ScoutProvider'),
      path.join(__dirname, '../../providers/IndexKeeperProvider')
    ])
    .registerAndBoot()

  setupResolver()
})

afterAll(async () => {
  try {
    await fs.remove(path.join(__dirname, 'app'))
  } catch (error) {
    if (process.platform !== 'win32' || error.code !== 'EBUSY') {
      throw error
    }
  }
}, 0)

describe('Import', () => {
  it('skip when no Model class is given', async () => {
    ace.addCommand(Import)
    const result = await ace.call('scout:import')
    expect(result).toEqual('Nothing to do')
  })
  it.skip('import models', async () => {
    ace.addCommand(Import)
    global.stack = []

    await fs.outputFile(path.join(__dirname, 'app/Models/Foo.js'), `
      const Model = use('Model');
      class Foo extends Model {
        static get traits () {
          return ['@provider:Searchable']
        }
      }
      module.exports = Foo
    `)

    ioc.bind('App/Models/Foo', () => require('./app/Models/Foo.js'))

    const result = await ace.call('scout:import', { model: 'Foo' })

    console.log(result)

    expect(global.stack).toContainEqual('foo')
  })
})
