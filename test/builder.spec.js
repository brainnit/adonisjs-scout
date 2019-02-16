'use strict'

const Builder = require('../src/Builder')
const VanillaSerializer = require('@adonisjs/lucid/src/Lucid/Serializers/Vanilla')

describe('Builder', () => {
  it('is macroable', () => {
    Builder.macro('foo', () => {
      return 'bar'
    })
    const builder = new Builder(jest.fn(), 'query')
    expect(builder.foo()).toEqual('bar')
  })

  it('constructor changes query', () => {
    const builder = new Builder(jest.fn(), 'foo')
    expect(builder.query).toEqual('foo')
  })

  it('within changes index', () => {
    const builder = new Builder(jest.fn(), 'query')
    builder.within('foo')
    expect(builder.index).toEqual('foo')
  })

  it('where adds to wheres', () => {
    const builder = new Builder(jest.fn(), 'query')
    builder.where('foo', 'match', 'bar')
    expect(builder.wheres).toContainEqual({
      field: 'foo',
      operator: 'match',
      value: 'bar'
    })
  })

  it('take changes limit', () => {
    const builder = new Builder(jest.fn(), 'query')
    builder.take(10)
    expect(builder.limit).toEqual(10)
  })

  it('orderBy adds to orders', () => {
    const builder = new Builder(jest.fn(), 'query')
    builder.orderBy('foo', 'asc')
    expect(builder.orders).toContainEqual({ field: 'foo', direction: 'asc' })
  })

  it('aggregate adds to aggregates', () => {
    const builder = new Builder(jest.fn(), 'query')
    builder.aggregate('sum', 'foo')
    expect(builder.aggregates).toContainEqual({
      operator: 'sum',
      field: 'foo'
    })
  })

  it('raw forwards to engine and returns as is', () => {
    const engineMock = jest.fn()
    engineMock.search = jest.fn(() => 'foo')

    const modelMock = jest.fn()
    modelMock.searchableUsing = jest.fn(() => engineMock)

    const builder = new Builder(modelMock, 'query')

    expect(builder.raw()).toEqual('foo')
    expect(engineMock.search).toHaveBeenCalledWith(builder)
  })

  it('keys forwards to engine and returns as is', () => {
    const engineMock = jest.fn()
    engineMock.keys = jest.fn(() => 'foo')

    const modelMock = jest.fn()
    modelMock.searchableUsing = jest.fn(() => engineMock)

    const builder = new Builder(modelMock, 'query')

    expect(builder.keys()).toEqual('foo')
    expect(engineMock.keys).toHaveBeenCalledWith(builder)
  })

  it('get forwards to engine and returns as is', () => {
    const engineMock = jest.fn()
    engineMock.get = jest.fn(() => 'foo')

    const modelMock = jest.fn()
    modelMock.searchableUsing = jest.fn(() => engineMock)

    const builder = new Builder(modelMock, 'query')

    expect(builder.get()).toEqual('foo')
    expect(engineMock.get).toHaveBeenCalledWith(builder)
  })

  it('paginate correctly returns LengthPaginator with expected state', async () => {
    const modelMock = jest.fn()
    modelMock.searchableUsing = jest.fn(() => engineMock)

    const results = new VanillaSerializer([ modelMock ])

    const engineMock = jest.fn()

    engineMock.paginate = jest.fn(() => {
      return new Promise(resolve => resolve([]))
    })

    engineMock.map = jest.fn(() => results)

    engineMock.getTotalCount = jest.fn(() => 99)

    const builder = new Builder(modelMock)
    const paginator = await builder.paginate()

    expect(paginator.getCollection()).toBe(results)
    expect(paginator.total).toEqual(99)
    expect(paginator.currentPage).toEqual(1)
    expect(paginator.perPage).toEqual(20)
  })

  it('engine is grabbed from model', () => {
    const modelMock = jest.fn()
    modelMock.searchableUsing = jest.fn(() => 'foo')
    const builder = new Builder(modelMock, 'query')
    expect(builder.engine()).toEqual('foo')
  })
})
