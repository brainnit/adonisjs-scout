'use strict'

require('@adonisjs/lucid/lib/iocResolver').setFold(require('@adonisjs/fold'))
const fs = require('fs-extra')
const path = require('path')
const { ioc, registrar } = require('@adonisjs/fold')
const { Config, setupResolver, Helpers } = require('@adonisjs/sink')
const Model = require('@adonisjs/lucid/src/Lucid/Model')
const setup = require('../unit/fixtures/setup')

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
      driver: 'elasticsearch',
      prefix: '',
      elasticsearch: {
        connection: {
          hosts: ['localhost:9200'],
          user: 'elastic',
          password: 'secret'
        },
        options: { apiVersion: '6.4' },
        debug: false
      }
    })

    return config
  })

  ioc.alias('Adonis/Src/Config', 'Config')

  ioc.bind('Adonis/Src/Helpers', () => {
    return new Helpers(path.join(__dirname))
  })

  await registrar
    .providers([
      '@adonisjs/lucid/providers/LucidProvider',
      path.join(__dirname, '../../providers/ScoutProvider')
    ])
    .registerAndBoot()

  const eventMock = jest.fn()
  eventMock.on = jest.fn()
  eventMock.emit = jest.fn()
  eventMock.removeListener = jest.fn()
  ioc.bind('Adonis/Src/Event', () => eventMock)
  ioc.alias('Adonis/Src/Event', 'Event')

  ioc.bind('Adonis/Src/Model', () => Model)
  ioc.alias('Adonis/Src/Model', 'Model')

  await fs.ensureDir(path.join(__dirname, '../tmp'))

  setupResolver()

  await setup.setupTables(ioc.use('Database'))
})

afterEach(async () => {
  await setup.truncateTables(ioc.use('Database'))
})

afterAll(async () => {
  await setup.dropTables(ioc.use('Database'))
  ioc.use('Database').close()
})

describe('search', () => {
  it('searched results are returned in correct order', async () => {
    await ioc.use('Database').table('stubs').insert([
      { title: 'first', created_at: '2017-01-09', updated_at: '2017-01-09' },
      { title: 'second', created_at: '2018-03-10', updated_at: '2018-03-10' },
      { title: 'third', created_at: '2019-06-09', updated_at: '2019-06-09' }
    ])

    const TestModel = require('../unit/fixtures/TestModel')
    TestModel._bootIfNotBooted()

    await TestModel.makeAllSearchable()

    const query = TestModel.search()
    query.orderBy('created_at', 'desc')
    const results = await query.paginateAfter(null, 10)

    expect(results.toJSON()).toMatchObject({
      totalCount: 3,
      edges: [
        {
          node: {
            id: 3,
            title: 'third',
            created_at: '2019-06-09T03:00:00.000Z',
            updated_at: '2019-06-09T03:00:00.000Z'
          },
          cursor: 'WyIyMDE5LTA2LTA5Il0='
        },
        {
          node: {
            id: 2,
            title: 'second',
            created_at: '2018-03-10T03:00:00.000Z',
            updated_at: '2018-03-10T03:00:00.000Z'
          },
          cursor: 'WyIyMDE4LTAzLTEwIl0='
        },
        {
          node: {
            id: 1,
            title: 'first',
            created_at: '2017-01-09T02:00:00.000Z',
            updated_at: '2017-01-09T02:00:00.000Z'
          },
          cursor: 'WyIyMDE3LTAxLTA5Il0='
        }
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: 'WyIyMDE5LTA2LTA5Il0=',
        endCursor: 'WyIyMDE3LTAxLTA5Il0='
      }
    })
  })
})
