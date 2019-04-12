'use strict'

require('dotenv').load()
require('@adonisjs/lucid/lib/iocResolver').setFold(require('@adonisjs/fold'))
const { ioc } = require('@adonisjs/fold')
const { setupResolver } = require('@adonisjs/sink')
const AbstractDriver = require('../../src/Drivers/Abstract')
const ElasticsearchDriver = require('../../src/Drivers').elasticsearch
const VanillaSerializer = require('@adonisjs/lucid/src/Lucid/Serializers/Vanilla')
const Model = require('@adonisjs/lucid/src/Lucid/Model')
const Builder = require('../../src/Builder')
const SearchRule = require('../../src/SearchRule')
const nock = require('nock')
const bodybuilder = require('bodybuilder')

beforeAll(() => {
  ioc.bind('Adonis/Src/Model', () => Model)
  ioc.alias('Adonis/Src/Model', 'Model')

  ioc.bind('Adonis/Traits/Searchable', () => {
    const Searchable = require('../../src/Searchable')
    return new Searchable()
  })
  ioc.alias('Adonis/Traits/Searchable', 'Searchable')

  setupResolver()

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

  it('update adds objects to index', () => {
    expect.assertions(3)

    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.transporter = jest.fn()
    elasticsearch.transporter.initIndex = jest.fn(() => {
      return new Promise((resolve) => {
        resolve(true)
      })
    })

    elasticsearch.transporter.indexBulk = jest.fn((a, b) => {
      expect(a).toEqual('table')
      expect(b).toEqual([
        { id: 'key1', data: { foo: 'bar' } }
      ])
    })

    const modelMock = jest.fn()
    modelMock.searchableAs = jest.fn(() => 'table')
    modelMock.getSearchableKey = jest.fn(() => 'key1')
    modelMock.toSearchableJSON = jest.fn(() => {
      return { foo: 'bar' }
    })

    const collection = new VanillaSerializer([ modelMock ])
    elasticsearch.update(collection)

    expect(elasticsearch.transporter.initIndex).toHaveBeenCalledWith('table')
  })

  it('delete remove objects from index', () => {
    expect.assertions(3)

    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.transporter = jest.fn()
    elasticsearch.transporter.initIndex = jest.fn(() => {
      return new Promise(resolve => resolve(true))
    })

    elasticsearch.transporter.deleteBulk = jest.fn((a, b) => {
      expect(a).toEqual('table')
      expect(b).toEqual([ 'key1' ])
    })

    const modelMock = jest.fn()
    modelMock.searchableAs = jest.fn(() => 'table')
    modelMock.getSearchableKey = jest.fn(() => 'key1')

    const collection = new VanillaSerializer([ modelMock ])
    elasticsearch.delete(collection)

    expect(elasticsearch.transporter.initIndex).toHaveBeenCalledWith('table')
  })

  it('_buildQueryDSL correctly builds full query', () => {
    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.queryBuilder = bodybuilder()

    const builder = new Builder(jest.fn(), 'sonho grande')
    builder.where('product', '=', 'book')
    builder.orderBy('price', 'desc')
    builder.aggregate('max', 'price')

    const query = elasticsearch._buildQueryDSL(builder)

    expect(query).toEqual({
      sort: [
        {
          'price': {
            order: 'desc'
          }
        }
      ],
      query: {
        bool: {
          filter: {
            term: {
              'product': 'book'
            }
          },
          must: {
            query_string: {
              query: 'sonho grande'
            }
          }
        }
      },
      aggs: {
        agg_max_price: {
          'max': {
            field: 'price'
          }
        }
      }
    })
  })

  it('_buildQueryDSL correctly builds query DSL when using rules', () => {
    ioc.bind('SearchRuleStub', () => SearchRuleStub)
    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.queryBuilder = bodybuilder()

    const modelMock = jest.fn()
    modelMock.searchableRules = jest.fn(() => ['SearchRuleStub'])

    const builder = new Builder(modelMock, 'foobar')
    builder.rule('SearchRuleStub')

    const query = elasticsearch._buildQueryDSL(builder)

    expect(query).toEqual({
      query: {
        bool: {
          must: {
            query_string: {
              query: 'foobar'
            }
          }
        }
      }
    })
  })

  it('_buildQueryDSL query returns empty when nothing is queried', () => {
    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.queryBuilder = bodybuilder()

    const builder = new Builder(jest.fn())
    const query = elasticsearch._buildQueryDSL(builder)

    expect(query).toEqual({})
  })

  it('_buildQueryDSL correctly builds paginate query', () => {
    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.queryBuilder = bodybuilder()

    const builder = new Builder(jest.fn())
    builder.orderBy('foo')

    const query = elasticsearch._buildQueryDSL(builder, {
      page: 2,
      limit: 20
    })

    expect(query).toEqual({
      sort: [
        {
          foo: {
            order: 'asc'
          }
        }
      ],
      from: 20,
      size: 20
    })
  })

  it('_buildQueryDSL correctly builds paginateAfter query', () => {
    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.queryBuilder = bodybuilder()

    const builder = new Builder(jest.fn())
    builder.orderBy('foo')

    const query = elasticsearch._buildQueryDSL(builder, {
      after: ['cursor'],
      limit: 20
    })

    expect(query).toEqual({
      sort: [
        {
          foo: {
            order: 'asc'
          }
        }
      ],
      search_after: ['cursor'],
      size: 20
    })
  })

  it('mapIds returns array of object ids from results', () => {
    const elasticsearch = new ElasticsearchDriver()

    const results = {
      'hits': {
        'total': 2,
        'hits': [
          { '_id': 'foo' },
          { '_id': 'bar' }
        ]
      }
    }

    const ids = elasticsearch.mapIds(results)

    expect(ids).toEqual(['foo', 'bar'])
  })

  it('map correctly maps results to models', async () => {
    const elasticsearch = new ElasticsearchDriver()

    const results = {
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
    }

    const TestModel = require('./fixtures/TestModel')
    TestModel._bootIfNotBooted()
    const resultModel = new TestModel()
    resultModel.newUp({ id: 'yGKT6GgBcXAjfRQqBFTQ' })

    const collection = new VanillaSerializer([ resultModel ])

    const promiseMock = new Promise(resolve => {
      return resolve(collection)
    })

    const modelMock = jest.fn()
    modelMock.getSearchableKey = jest.fn(() => 'yGKT6GgBcXAjfRQqBFTQ')
    modelMock.getScoutModelsByIds = jest.fn(() => promiseMock)

    const builder = new Builder(modelMock)
    const map = await elasticsearch.map(builder, results, builder.model)

    expect(map).toEqual(collection)
  })

  it('getTotalCount returns total from results', () => {
    const elasticsearch = new ElasticsearchDriver()

    const results = {
      'hits': {
        'total': 9,
        'hits': []
      }
    }

    const total = elasticsearch.getTotalCount(results)

    expect(total).toEqual(9)
  })

  it('paginate correctly calls _performSearch and return its results', () => {
    const builder = jest.fn()
    const results = []

    const elasticsearch = new ElasticsearchDriver()
    elasticsearch._performSearch = jest.fn(() => results)

    const paginate = elasticsearch.paginate(builder, 1, 20)

    expect(paginate).toEqual(results)
    expect(elasticsearch._performSearch).toHaveBeenCalledWith(builder, {
      page: 1,
      limit: 20
    })
  })

  it('paginateAfter correctly calls _performSearch and return its results', () => {
    const builder = jest.fn()
    const results = []

    const elasticsearch = new ElasticsearchDriver()
    elasticsearch._performSearch = jest.fn(() => results)

    const paginate = elasticsearch.paginateAfter(builder, ['foo', 'bar'], 20)

    expect(paginate).toEqual(results)
    expect(elasticsearch._performSearch).toHaveBeenCalledWith(builder, {
      after: ['foo', 'bar'],
      limit: 20
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

  it('initIndex calls createIndex if given index does not exist', async () => {
    const transporter = new ElasticsearchDriver.Transport(config)
    transporter.Client.indices.exists = jest.fn(() => false)
    transporter.createIndex = jest.fn(() => true)
    expect(await transporter.initIndex('foo')).toBe(true)
    expect(transporter.Client.indices.exists).toHaveBeenCalledWith({
      index: 'foo'
    })
    expect(transporter.createIndex).toHaveBeenCalledWith('foo', {})
  })

  it('initIndex calls updateIndex if given index already exist', async () => {
    const transporter = new ElasticsearchDriver.Transport(config)
    transporter.Client.indices.exists = jest.fn(() => true)
    transporter.updateIndex = jest.fn(() => true)
    expect(await transporter.initIndex('foo')).toBe(true)
    expect(transporter.Client.indices.exists).toHaveBeenCalledWith({
      index: 'foo'
    })
    expect(transporter.updateIndex).toHaveBeenCalledWith('foo', {})
  })

  it('createIndex creates a new index', async () => {
    const transporter = new ElasticsearchDriver.Transport(config)
    jest.spyOn(transporter.Client.indices, 'create')

    const interceptor = nock('http://localhost:9200')
      .put('/users')
      .reply(200, {
        'acknowledged': true
      })

    await transporter.createIndex('users', { foo: 'bar' })

    expect(transporter.Client.indices.create).toHaveBeenCalledWith({
      index: 'users',
      body: {
        foo: 'bar'
      }
    }, expect.anything())

    nock.removeInterceptor(interceptor)
  })

  it('updateIndex updates an existing index', async () => {
    const transporter = new ElasticsearchDriver.Transport(config)
    jest.spyOn(transporter.Client.indices, 'upgrade')

    const interceptor = nock('http://localhost:9200')
      .post('/users/_upgrade')
      .reply(200, {
        'acknowledged': true
      })

    await transporter.updateIndex('users', { foo: 'bar' })

    expect(transporter.Client.indices.upgrade).toHaveBeenCalledWith({
      index: 'users',
      body: {
        foo: 'bar'
      }
    }, expect.anything())

    nock.removeInterceptor(interceptor)
  })

  it('indexBulk adds object to index', async () => {
    const transporter = new ElasticsearchDriver.Transport(config)
    jest.spyOn(transporter.Client, 'bulk')

    const interceptor = nock('http://localhost:9200')
      .post('/_bulk')
      .reply(200, {
        'took': 0,
        'errors': false,
        'items': [
          {
            'index': {
              '_index': 'test',
              '_type': '_doc',
              '_id': '1',
              '_version': 1,
              'result': 'created',
              '_shards': {
                'total': 2,
                'successful': 1,
                'failed': 0
              },
              'status': 201,
              '_seq_no': 0,
              '_primary_term': 1
            }
          }
        ]
      })

    await transporter.indexBulk('users', [
      { id: '1', data: { foo: 'bar' } }
    ])

    expect(transporter.Client.bulk).toHaveBeenCalledWith({
      body: [
        { index: { _index: 'users', _type: '_doc', _id: '1' } },
        { foo: 'bar' }
      ]
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
    jest.spyOn(transporter.Client, 'deleteByQuery')

    const interceptor = nock('http://localhost:9200')
      .post('/users/_delete_by_query')
      .reply(200, {
        '_shards': {
          'total': 1,
          'successful': 1,
          'failed': 0
        }
      })

    await transporter.flushIndex('users')

    expect(transporter.Client.deleteByQuery).toHaveBeenCalledWith({
      index: 'users',
      body: {
        query: {
          match_all: {}
        }
      }
    }, expect.anything())

    nock.removeInterceptor(interceptor)
  })

  it('_query correctly composes match_all query', () => {
    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.queryBuilder = bodybuilder()

    const query = elasticsearch._query('*').build()

    expect(query).toEqual({
      'query': {
        'match_all': {}
      }
    })
  })

  it('_query correctly composes query_string query', () => {
    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.queryBuilder = bodybuilder()

    const query = elasticsearch._query('foo').build()

    expect(query).toEqual({
      'query': {
        'query_string': {
          'query': 'foo'
        }
      }
    })
  })

  it('_where correctly composes AND query', () => {
    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.queryBuilder = bodybuilder()

    const query = elasticsearch._where([
      {
        grouping: 'where',
        type: 'whereBasic',
        field: 'foo',
        operator: '=',
        value: 'bar',
        not: false,
        bool: 'and'
      }
    ]).build()

    expect(query).toEqual({
      query: {
        bool: {
          filter: {
            term: { 'foo': 'bar' }
          }
        }
      }
    })
  })

  it('_where correctly composes NOT-AND query', () => {
    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.queryBuilder = bodybuilder()

    const query = elasticsearch._where([
      {
        grouping: 'where',
        type: 'whereBasic',
        field: 'foo',
        operator: '=',
        value: 'bar',
        not: true,
        bool: 'and'
      }
    ]).build()

    expect(query).toEqual({
      query: {
        bool: {
          filter: {
            bool: {
              must_not: [
                { term: { 'foo': 'bar' } }
              ]
            }
          }
        }
      }
    })
  })

  it('_where correctly composes OR query', () => {
    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.queryBuilder = bodybuilder()

    const query = elasticsearch._where([
      {
        grouping: 'where',
        type: 'whereBasic',
        field: 'foo',
        operator: '=',
        value: 'bar',
        not: false,
        bool: 'or'
      }
    ]).build()

    expect(query).toEqual({
      query: {
        bool: {
          filter: {
            bool: {
              should: [
                { term: { 'foo': 'bar' } }
              ]
            }
          }
        }
      }
    })
  })

  it('_where correctly composes NOT-OR query', () => {
    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.queryBuilder = bodybuilder()

    const query = elasticsearch._where([
      {
        grouping: 'where',
        type: 'whereBasic',
        field: 'foo',
        operator: '=',
        value: 'bar',
        not: true,
        bool: 'or'
      }
    ]).build()

    expect(query).toEqual({
      query: {
        bool: {
          filter: {
            bool: {
              should: [
                {
                  bool: {
                    must_not: [
                      { term: { 'foo': 'bar' } }
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    })
  })

  it('_buildQueryDSL correctly composes complex where query', () => {
    const elasticsearch = new ElasticsearchDriver()
    elasticsearch.queryBuilder = bodybuilder()

    const builder = new Builder(jest.fn())
    builder.where('type', '=', 'physical')
    builder.orWhere(function () {
      this.where('type', '=', 'download')
      this.where('category', '=', 'other')
    })

    const query = elasticsearch._buildQueryDSL(builder)

    expect(query).toEqual({
      query: {
        bool: {
          filter: {
            bool: {
              must: {
                term: {
                  'type': 'physical'
                }
              },
              should: [
                {
                  bool: {
                    must: [
                      {
                        term: {
                          'type': 'download'
                        }
                      },
                      {
                        term: {
                          'category': 'other'
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    })
  })

  it('_whereBasic throws if operator is not supported', () => {
    const elasticsearch = new ElasticsearchDriver()
    const cb = () => {
      elasticsearch._whereBasic({
        field: 'foo',
        operator: 'invalid',
        value: 'bar'
      })
    }

    expect(cb).toThrow()
  })

  it('_whereBasic correctly composes equal to query', () => {
    const elasticsearch = new ElasticsearchDriver()
    const query = elasticsearch._whereBasic({
      field: 'foo',
      operator: '=',
      value: 'bar'
    })

    expect(query).toEqual(['term', { 'foo': 'bar' }])
  })

  it('_whereBasic correctly composes greater than query', () => {
    const elasticsearch = new ElasticsearchDriver()
    const query = elasticsearch._whereBasic({
      field: 'foo', operator: '>', value: 1
    })

    expect(query).toEqual(['range', { 'foo': { 'gt': 1 } }])
  })

  it('_whereBasic correctly composes less than query', () => {
    const elasticsearch = new ElasticsearchDriver()
    const query = elasticsearch._whereBasic({
      field: 'foo', operator: '>', value: 1
    })

    expect(query).toEqual(['range', { 'foo': { 'gt': 1 } }])
  })

  it('_whereBasic correctly composes greater than or equal to query', () => {
    const elasticsearch = new ElasticsearchDriver()
    const query = elasticsearch._whereBasic({
      field: 'foo', operator: '>=', value: 1
    })

    expect(query).toEqual(['range', { 'foo': { 'gte': 1 } }])
  })

  it('_whereBasic correctly composes less than or equal to query', () => {
    const elasticsearch = new ElasticsearchDriver()
    const query = elasticsearch._whereBasic({
      field: 'foo', operator: '<=', value: 1
    })

    expect(query).toEqual(['range', { 'foo': { 'lte': 1 } }])
  })

  it('_whereWrapped correctly composes function query', () => {
    const builder = new Builder(jest.fn())
    const elasticsearch = new ElasticsearchDriver()

    builder.where(function () {
      this.where('foo', '=', 'bar')
    })

    const query = elasticsearch._whereWrapped(
      bodybuilder(),
      builder.statements[0]
    ).build()

    expect(query).toEqual({
      'query': {
        'bool': {
          'filter': {
            'term': {
              'foo': 'bar'
            }
          }
        }
      }
    })
  })
})

it('_order correctly composes partial DSL', () => {
  const builder = new Builder(jest.fn())
  const elasticsearch = new ElasticsearchDriver()
  elasticsearch.queryBuilder = bodybuilder()

  builder.orderBy('foo')
  builder.orderBy('bar', 'desc')

  const query = elasticsearch._order(builder.statements).build()

  expect(query).toEqual({
    sort: [
      { foo: { order: 'asc' } },
      { bar: { order: 'desc' } }
    ]
  })
})

it('_orderByBasic correctly composes partial query DSL', () => {
  const builder = new Builder(jest.fn())
  const elasticsearch = new ElasticsearchDriver()
  elasticsearch.queryBuilder = bodybuilder()

  builder.orderBy('foo', 'desc')

  const query = elasticsearch._orderByBasic(builder.statements[0]).build()

  expect(query).toEqual({
    sort: [
      { foo: { order: 'desc' } }
    ]
  })
})

it('_aggregate correctly composes partial query DSL', () => {
  const builder = new Builder(jest.fn())
  const elasticsearch = new ElasticsearchDriver()
  elasticsearch.queryBuilder = bodybuilder()

  builder.aggregate('max', 'price')
  builder.aggregate('min', 'quantity')

  const query = elasticsearch._aggregate(builder.statements).build()

  expect(query).toEqual({
    aggs: {
      agg_max_price: {
        max: {
          field: 'price'
        }
      },
      agg_min_quantity: {
        min: {
          field: 'quantity'
        }
      }
    }
  })
})

it('_aggregateBasic correctly composes partial query DSL', () => {
  const builder = new Builder(jest.fn())
  const elasticsearch = new ElasticsearchDriver()
  elasticsearch.queryBuilder = bodybuilder()

  builder.aggregate('max', 'price')

  const query = elasticsearch._aggregateBasic(builder.statements[0]).build()

  expect(query).toEqual({
    aggs: {
      agg_max_price: {
        max: {
          field: 'price'
        }
      }
    }
  })
})

class SearchRuleStub extends SearchRule {
  buildQuery () {
    return {
      bool: {
        must: {
          query_string: {
            query: this.builder.query
          }
        }
      }
    }
  }
}

class OtherSearchRuleStub extends SearchRule {
  buildQuery () {
    return {
      bool: {
        must: {
          match: {
            foo: this.builder.query
          }
        }
      }
    }
  }
}
