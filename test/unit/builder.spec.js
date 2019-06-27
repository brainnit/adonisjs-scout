'use strict'

const VanillaSerializer = require('@adonisjs/lucid/src/Lucid/Serializers/Vanilla')

const Builder = require('../../src/Builder')
const GlobalSearchableScopes = require('../../src/GlobalSearchableScopes')

describe('Builder', () => {
  it('is macroable', () => {
    Builder.macro('foo', () => {
      return 'bar'
    })

    const builder = new Builder(new ModelStub(), 'query')
    expect(builder.foo()).toEqual('bar')
  })

  it('constructor changes query', () => {
    const builder = new Builder(new ModelStub(), 'foo')
    expect(builder.query).toEqual('foo')
  })

  it('within changes index', () => {
    const builder = new Builder(new ModelStub(), 'query')
    builder.within('foo')
    expect(builder.index).toEqual('foo')
  })

  it('where adds whereBasic statement', () => {
    const builder = new Builder(new ModelStub(), 'query')
    builder.where('foo', '=', 'bar')
    expect(builder._statements).toContainEqual({
      grouping: 'where',
      type: 'whereBasic',
      field: 'foo',
      operator: '=',
      value: 'bar',
      not: false,
      bool: 'and'
    })
  })

  it('where adds NOT whereBasic statement when `!=` is used as operator', () => {
    const builder = new Builder(new ModelStub(), 'query')
    builder.where('foo', '!=', 'bar')
    expect(builder._statements).toContainEqual({
      grouping: 'where',
      type: 'whereBasic',
      field: 'foo',
      operator: '=',
      value: 'bar',
      not: true,
      bool: 'and'
    })
  })

  it('where adds NOT whereBasic statement when `<>` is used as operator', () => {
    const builder = new Builder(new ModelStub(), 'query')
    builder.where('foo', '<>', 'bar')
    expect(builder._statements).toContainEqual({
      grouping: 'where',
      type: 'whereBasic',
      field: 'foo',
      operator: '=',
      value: 'bar',
      not: true,
      bool: 'and'
    })
  })

  it('where given a callback adds whereWrapped statement', () => {
    const builder = new Builder(new ModelStub(), 'query')
    const cb = builder => {}
    builder.where(cb)

    expect(builder._statements).toContainEqual({
      grouping: 'where',
      type: 'whereWrapped',
      value: expect.any(Function),
      not: false,
      bool: 'and'
    })
  })

  it('orWhere adds OR whereBasic statement', () => {
    const builder = new Builder(new ModelStub(), 'query')
    builder.orWhere('foo', '=', 'bar')
    expect(builder._statements).toContainEqual({
      grouping: 'where',
      type: 'whereBasic',
      field: 'foo',
      operator: '=',
      value: 'bar',
      not: false,
      bool: 'or'
    })
  })

  it('whereNot adds NOT whereBasic statement', () => {
    const builder = new Builder(new ModelStub(), 'query')
    builder.whereNot('foo', '=', 'bar')
    expect(builder._statements).toContainEqual({
      grouping: 'where',
      type: 'whereBasic',
      field: 'foo',
      operator: '=',
      value: 'bar',
      not: true,
      bool: 'and'
    })
  })

  it('orWhereNot adds OR NOT whereBasic statement', () => {
    const builder = new Builder(new ModelStub(), 'query')
    builder.orWhereNot('foo', '=', 'bar')
    expect(builder._statements).toContainEqual({
      grouping: 'where',
      type: 'whereBasic',
      field: 'foo',
      operator: '=',
      value: 'bar',
      not: true,
      bool: 'or'
    })
  })

  it('take changes limit', () => {
    const builder = new Builder(new ModelStub(), 'query')
    builder.take(10)
    expect(builder.limit).toEqual(10)
  })

  it('orderBy adds orderByBasic statement', () => {
    const builder = new Builder(new ModelStub(), 'query')
    builder.orderBy('foo', 'asc')

    expect(builder._statements).toContainEqual({
      grouping: 'order',
      type: 'orderByBasic',
      value: 'foo',
      direction: 'asc'
    })
  })

  it('aggregate adds aggregateBasic statement', () => {
    const builder = new Builder(new ModelStub(), 'query')
    builder.aggregate('sum', 'foo')

    expect(builder._statements).toContainEqual({
      grouping: 'aggregate',
      type: 'aggregateBasic',
      method: 'sum',
      value: 'foo'
    })
  })

  it('raw forwards to engine and returns as is', () => {
    const engineMock = jest.fn()
    engineMock.search = jest.fn(() => 'foo')

    const modelMock = new ModelStub()
    modelMock.searchableUsing = jest.fn(() => engineMock)

    const builder = new Builder(modelMock, 'query')

    expect(builder.raw()).toEqual('foo')
    expect(engineMock.search).toHaveBeenCalledWith(builder)
  })

  it('keys forwards to engine and returns as is', () => {
    const engineMock = jest.fn()
    engineMock.keys = jest.fn(() => 'foo')

    const modelMock = new ModelStub()
    modelMock.searchableUsing = jest.fn(() => engineMock)

    const builder = new Builder(modelMock, 'query')

    expect(builder.keys()).toEqual('foo')
    expect(engineMock.keys).toHaveBeenCalledWith(builder)
  })

  it('get forwards to engine and returns as is', () => {
    const engineMock = jest.fn()
    engineMock.get = jest.fn(() => 'foo')

    const modelMock = new ModelStub()
    modelMock.searchableUsing = jest.fn(() => engineMock)

    const builder = new Builder(modelMock, 'query')

    expect(builder.get()).toEqual('foo')
    expect(engineMock.get).toHaveBeenCalledWith(builder)
  })

  it('paginate correctly returns LengthPaginator with expected state', async () => {
    const modelMock = new ModelStub()
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

  it('paginateAfter correctly returns CursorPaginator without cursor', async () => {
    const modelMock = new ModelStub()
    modelMock.searchableUsing = jest.fn(() => engineMock)
    modelMock.constructor.getSearchableKeyName = jest.fn(() => 'id')

    const results = new VanillaSerializer([ modelMock ])

    const engineMock = jest.fn()

    engineMock.paginateAfter = jest.fn(() => {
      return new Promise(resolve => resolve([]))
    })

    engineMock.map = jest.fn(() => results)

    engineMock.getTotalCount = jest.fn(() => 99)

    engineMock.cursors = jest.fn(() => ['id'])

    const builder = new Builder(modelMock)
    const paginator = await builder.paginateAfter()

    expect(engineMock.paginateAfter).toHaveBeenCalledWith(builder, null, 21)

    expect(paginator.getCollection()).toBe(results)
    expect(paginator.total).toEqual(99)
    expect(paginator.cursor).toBeNull()
    expect(paginator.perPage).toEqual(20)
  })

  it('engine is grabbed from model', () => {
    const modelMock = new ModelStub()
    modelMock.searchableUsing = jest.fn(() => 'foo')
    const builder = new Builder(modelMock, 'query')
    expect(builder.engine()).toEqual('foo')
  })
})

class ModelStub {
  static get $globalSearchableScopes () {
    return new GlobalSearchableScopes()
  }
}
