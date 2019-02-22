'use strict'

const ace = require('@adonisjs/ace')
const fs = require('fs-extra')
const path = require('path')
const { ioc, registrar } = require('@adonisjs/fold')
const { Config, setupResolver, Helpers } = require('@adonisjs/sink')

const IndexCreate = require('../../src/Commands/IndexCreate')

beforeAll(async () => {
  ioc.singleton('Adonis/Src/Config', function () {
    const config = new Config()
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

  await fs.ensureDir(path.join(__dirname, 'app/Models/IndexKeepers'))

  await registrar
    .providers([
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

describe('Index Create', () => {
  it('skip when no IndexKeeper class is given', async () => {
    ace.addCommand(IndexCreate)
    const result = await ace.call('scout:indexCreate')
    expect(result).toEqual('Nothing to do')
  })

  it('run index keepers in sequence', async () => {
    ace.addCommand(IndexCreate)
    global.stack = []

    await fs.outputFile(path.join(__dirname, 'app/Models/IndexKeepers/bar.js'), `
      class IndexKeeper {
        up () {
          return new Promise((resolve) => {
            setTimeout(() => {
              (global).stack.push('bar')
              resolve()
            }, 10)
          })
        }
      }
      module.exports = IndexKeeper
    `)

    await fs.outputFile(path.join(__dirname, 'app/Models/IndexKeepers/baz.js'), `
      class IndexKeeper {
        up () {
          (global).stack.push('baz')
        }
      }
      module.exports = IndexKeeper
    `)

    await ace.call('scout:indexCreate')
    expect(global.stack).toEqual(['bar', 'baz'])
  })

  it('run only selected files', async () => {
    ace.addCommand(IndexCreate)
    global.stack = []

    await fs.outputFile(path.join(__dirname, 'app/Models/IndexKeepers/foo.js'), `
      class IndexKeeper {
        up () {
          return new Promise((resolve) => {
            setTimeout(() => {
              (global).stack.push('foo')
              resolve()
            }, 10)
          })
        }
      }
      module.exports = IndexKeeper
    `)

    await fs.outputFile(path.join(__dirname, 'app/Models/IndexKeepers/bar.js'), `
      class IndexKeeper {
        up () {
          (global).stack.push('bar')
        }
      }
      module.exports = IndexKeeper
    `)

    await ace.call('scout:indexCreate', {}, { files: 'foo.js' })
    expect(global.stack).toContainEqual('foo')
  })
})
