'use strict'

require('dotenv').load()
const { ioc } = require('@adonisjs/fold')
const AbstractDriver = require('../src/Drivers/Abstract')
const ElasticsearchDriver = require('../src/Drivers').elasticsearch
const VanillaSerializer = require('@adonisjs/lucid/src/Lucid/Serializers/Vanilla')
const Builder = require('../src/Builder')
const SearchRule = require('../src/SearchRule')
const nock = require('nock')
const bodybuilder = require('bodybuilder')

beforeAll(() => {
  nock.disableNetConnect()
  nock('http://localhost:9200').get('/').reply(200, 'connection')
})

afterAll(() => {
  nock.enableNetConnect()
})

describe('ElasticsearchDriver', () => {
  it('driver should be an instanceof abstract driver', () => {
    const elasticsearch = new ElasticsearchDriver()
    expect(elasticsearch).toBeInstanceOf(AbstractDriver)
  })

  it('get driver instance', () => {
    const elasticsearch = new ElasticsearchDriver()
    expect(elasticsearch).toBeInstanceOf(ElasticsearchDriver)
  })

  it.skip('update adds objects to index', () => {
    const transporterMock = jest.fn()
    transporterMock.initIndex = jest.fn()
    transporterMock.index = jest.fn()
    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.transporter = transporterMock

    const modelMock = jest.fn()
    modelMock.searchableAs = jest.fn(() => 'mocks')
    modelMock.getSearchableKey = jest.fn(() => 'key1')
    modelMock.toSearchableJSON = jest.fn(() => {
      return { foo: 'bar' }
    })

    const collection = new VanillaSerializer([ modelMock ])
    elasticsearch.update(collection)

    expect(transporterMock.initIndex).toHaveBeenCalledWith('mocks')
    expect(transporterMock.index).toHaveBeenCalledWith(
      'mocks', 'key1', { foo: 'bar' }
    )
  })

  it.skip('delete remove objects from index', () => {
    const transporterMock = jest.fn()
    transporterMock.initIndex = jest.fn()
    transporterMock.deleteBulk = jest.fn()
    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.transporter = transporterMock

    const modelMock = jest.fn()
    modelMock.searchableAs = jest.fn(() => 'mocks')
    modelMock.getSearchableKey = jest.fn(() => 'key1')

    const collection = new VanillaSerializer([ modelMock ])
    elasticsearch.delete(collection)

    expect(transporterMock.initIndex).toHaveBeenCalledWith('mocks')
    expect(transporterMock.deleteBulk).toHaveBeenCalledWith('mocks', [ 'key1' ])
  })

  it('_buildQueryDSL builds full query', () => {
    const elasticsearch = new ElasticsearchDriver()
    const builder = new Builder(jest.fn())
    builder.query = 'zoo'
    builder.where('foo', 'match', 'bar')
    builder.orderBy('foo', 'asc')

    const query = elasticsearch._buildQueryDSL(builder)

    expect(query).toEqual({
      'sort': [
        {
          'foo': {
            'order': 'asc'
          }
        }
      ],
      'query': {
        'bool': {
          'filter': {
            'match': {
              'foo': 'bar'
            }
          },
          'must': {
            'query_string': {
              'query': 'zoo'
            }
          }
        }
      }
    })
  })

  it('_buildQueryDSL builds full query with rules', () => {
    ioc.bind('SearchRuleStub', () => SearchRuleStub)
    ioc.bind('OtherSearchRuleStub', () => OtherSearchRuleStub)
    const elasticsearch = new ElasticsearchDriver()
    const modelMock = jest.fn()
    modelMock.searchableRules = jest.fn(() => [
      'SearchRuleStub',
      'OtherSearchRuleStub'
    ])
    const builder = new Builder(modelMock)
    builder.rule('SearchRuleStub')
    builder.rule('OtherSearchRuleStub')
    builder.query = 'foobar'

    const query = elasticsearch._buildQueryDSL(builder)

    expect(query).toEqual({
      query: {
        bool: {
          must: [
            {
              bool: {
                must: {
                  query_string: {
                    query: 'foobar'
                  }
                }
              }
            },
            {
              bool: {
                match: {
                  foo: 'foobar'
                }
              }
            }
          ]
        }
      }
    })
  })
})

describe('ElasticsearchTransport', () => {
  const config = {
    connection: {
      hosts: [
        process.env.ELASTICSEARCH_HOST
      ],
      user: process.env.ELASTICSEARCH_USER,
      password: process.env.ELASTICSEARCH_PASSWORD
    },
    options: {
      apiVersion: '6.4'
    }
  }

  it('makeClient uses instance config as expected', () => {
    expect.assertions(1)
    class clientStub {
      constructor (instanceConfig) {
        expect(instanceConfig).toMatchObject({
          hosts: config.connection.hosts,
          httpAuth: `${config.connection.user}:${config.connection.password}`,
          apiVersion: '6.4'
        })
      }
    }
    const transporter = new ElasticsearchDriver.Transport(config)
    transporter.makeClient(clientStub)
  })

  it('initIndex calls _createIndex if given index does not exist', async () => {
    const transporter = new ElasticsearchDriver.Transport(config)
    transporter.Client.indices.exists = jest.fn(() => false)
    transporter._createIndex = jest.fn(() => true)
    expect(await transporter.initIndex('foo')).toBe(true)
    expect(transporter.Client.indices.exists).toHaveBeenCalledWith({
      index: 'foo'
    })
    expect(transporter._createIndex).toHaveBeenCalledWith('foo', {})
  })

  it('initIndex calls _updateIndex if given index already exist', async () => {
    const transporter = new ElasticsearchDriver.Transport(config)
    transporter.Client.indices.exists = jest.fn(() => true)
    transporter._updateIndex = jest.fn(() => true)
    expect(await transporter.initIndex('foo')).toBe(true)
    expect(transporter.Client.indices.exists).toHaveBeenCalledWith({
      index: 'foo'
    })
    expect(transporter._updateIndex).toHaveBeenCalledWith('foo', {})
  })

  it('_createIndex creates a new index', async () => {
    const transporter = new ElasticsearchDriver.Transport(config)
    jest.spyOn(transporter.Client.indices, 'create')

    const interceptor = nock('http://localhost:9200')
      .put('/users')
      .reply(200, {
        'acknowledged': true
      })

    await transporter._createIndex('users', { foo: 'bar' })

    expect(transporter.Client.indices.create).toHaveBeenCalledWith({
      index: 'users',
      body: {
        foo: 'bar'
      }
    }, expect.anything())

    nock.removeInterceptor(interceptor)
  })

  it('_createIndex updates an existing index', async () => {
    const transporter = new ElasticsearchDriver.Transport(config)
    jest.spyOn(transporter.Client.indices, 'upgrade')

    const interceptor = nock('http://localhost:9200')
      .post('/users/_upgrade')
      .reply(200, {
        'acknowledged': true
      })

    await transporter._updateIndex('users', { foo: 'bar' })

    expect(transporter.Client.indices.upgrade).toHaveBeenCalledWith({
      index: 'users',
      body: {
        foo: 'bar'
      }
    }, expect.anything())

    nock.removeInterceptor(interceptor)
  })

  it('index adds object to index', async () => {
    const transporter = new ElasticsearchDriver.Transport(config)
    jest.spyOn(transporter.Client, 'index')

    const interceptor = nock('http://localhost:9200')
      .post('/users/_doc/1')
      .reply(200, {
        '_index': 'users',
        '_type': '_doc',
        '_id': 'key1',
        '_version': 1,
        'result': 'created'
      })

    await transporter.index('users', '1', { foo: 'bar' })

    expect(transporter.Client.index).toHaveBeenCalledWith({
      index: 'users',
      type: '_doc',
      id: '1',
      body: {
        foo: 'bar'
      }
    }, expect.anything())

    nock.removeInterceptor(interceptor)
  })

  it('deleteBulk remove objects from index', async () => {
    const transporter = new ElasticsearchDriver.Transport(config)
    jest.spyOn(transporter.Client, 'bulk')

    const interceptor = nock('http://localhost:9200')
      .post('/_bulk')
      .reply(200, {
        'took': 0,
        'errors': false,
        'items': [
          {
            'delete': {
              '_index': 'users',
              '_type': '_doc',
              '_id': '1',
              '_version': 17,
              'result': 'deleted',
              'status': 200
            }
          }
        ]
      })

    await transporter.deleteBulk('users', [ '1' ])

    expect(transporter.Client.bulk).toHaveBeenCalledWith({
      body: [
        { delete: { _index: 'users', _type: '_doc', _id: '1' } }
      ]
    }, expect.anything())

    nock.removeInterceptor(interceptor)
  })

  it('search fetch results from index', async () => {
    const transporter = new ElasticsearchDriver.Transport(config)
    jest.spyOn(transporter.Client, 'search')

    const interceptor = nock('http://localhost:9200')
      .post('/users/_search')
      .reply(200, {
        'took': 0,
        'timed_out': false,
        'hits': {
          'total': 1,
          'max_score': 0.018018505,
          'hits': [
            {
              '_index': 'users',
              '_type': '_doc',
              '_id': 'yGKT6GgBcXAjfRQqBFTQ',
              '_score': 0.018018505,
              '_source': {
                'foo': 'bar'
              }
            }
          ]
        }
      })

    const query = bodybuilder().query('query_string', 'query', 'bar').build()

    await transporter.search('users', query)

    expect(transporter.Client.search).toHaveBeenCalledWith({
      index: 'users',
      body: query
    }, expect.anything())

    nock.removeInterceptor(interceptor)
  })

  it('flushIndex flushes the index', async () => {
    const transporter = new ElasticsearchDriver.Transport(config)
    jest.spyOn(transporter.Client.indices, 'flush')

    const interceptor = nock('http://localhost:9200')
      .post('/users/_flush?force=true')
      .reply(200, {
        '_shards': {
          'total': 1,
          'successful': 1,
          'failed': 0
        }
      })

    await transporter.flushIndex('users')

    expect(transporter.Client.indices.flush).toHaveBeenCalledWith({
      index: 'users',
      force: true
    }, expect.anything())

    nock.removeInterceptor(interceptor)
  })
})

class SearchRuleStub extends SearchRule {
  buildQuery () {
    return {
      must: {
        query_string: {
          query: this.builder.query
        }
      }
    }
  }
}

class OtherSearchRuleStub extends SearchRule {
  buildQuery () {
    return {
      match: {
        foo: this.builder.query
      }
    }
  }
}
