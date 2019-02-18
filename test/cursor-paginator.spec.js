'use strict'

const CursorPaginator = require('../src/Paginators/CursorPaginator')
const VanillaSerializer = require('@adonisjs/lucid/src/Lucid/Serializers/Vanilla')

describe('LengthAwarePaginator', () => {
  it('new instance correctly set its initial state', () => {
    const items = new VanillaSerializer([])
    const total = 999
    const cursor = 'ZmFrZWN1cnNvcg=='
    const perPage = 20

    const paginator = new CursorPaginator(items, total, cursor, perPage)

    expect(paginator.cursor).toEqual(cursor)
    expect(paginator.perPage).toEqual(perPage)
  })

  it('hasPreviousPage returns true if cursor is set', () => {
    const items = new VanillaSerializer([])
    const paginator = new CursorPaginator(items, 10, 'ZmFrZWN1cnNvcg==', 20)

    expect(paginator.hasPreviousPage()).toBe(true)
  })

  it('hasPreviousPage returns true if cursor is not set', () => {
    const items = new VanillaSerializer([])
    const paginator = new CursorPaginator(items, 10, null, 20)

    expect(paginator.hasPreviousPage()).toBe(false)
  })

  it('hasNextPage returns true if count is greater than perPage', () => {
    const items = new VanillaSerializer([1, 2, 3, 4])
    const paginator = new CursorPaginator(items, 9, null, 3)

    expect(paginator.hasNextPage()).toBe(true)
  })

  it('last item is dropped if items count is greater than perPage', () => {
    const items = new VanillaSerializer([1, 2, 3, 4])
    const paginator = new CursorPaginator(items, 9, null, 3)

    expect(paginator.items).toEqual([1, 2, 3])
  })

  it('hasNextPage returns false if count is equal or less than perPage', () => {
    const items = new VanillaSerializer([1, 2, 3, 4])
    const paginator = new CursorPaginator(items, 9, null, 4)

    expect(paginator.hasNextPage()).toBe(false)
  })

  it('startCursor returns first model cursor', () => {
    const modelmock = jest.fn()
    modelmock.getSearchableCursor = jest.fn(() => ['foo'])

    const items = new VanillaSerializer([ modelmock, 0 ])
    const paginator = new CursorPaginator(items, 2, null, 20)

    expect(paginator.startCursor()).toEqual('WyJmb28iXQ==')
  })

  it('endCursor returns last model cursor', () => {
    const modelmock = jest.fn()
    modelmock.getSearchableCursor = jest.fn(() => ['bar'])

    const items = new VanillaSerializer([ 0, modelmock ])
    const paginator = new CursorPaginator(items, 2, null, 20)

    expect(paginator.endCursor()).toEqual('WyJiYXIiXQ==')
  })

  it('encodeCursor makes the cursor opaque', () => {
    const cursor = CursorPaginator.encodeCursor(['foo', 'bar'])

    expect(cursor).toEqual('WyJmb28iLCJiYXIiXQ==')
  })

  it('decodeCursor returns the cursor on its original form', () => {
    const cursor = CursorPaginator.decodeCursor('WyJmb28iLCJiYXIiXQ==')

    expect(cursor).toEqual(['foo', 'bar'])
  })

  it('toJSON correctly returns paginator totalCount, pageInfo and data', () => {
    const modelMock = jest.fn()
    modelMock.toObject = jest.fn(() => ({ foo: 'bar' }))
    modelMock.getSearchableCursor = jest.fn(() => ['foo', 'bar'])

    const items = new VanillaSerializer([ modelMock ])
    const paginator = new CursorPaginator(items, 9, null, 10)

    expect(paginator.toJSON()).toEqual({
      totalCount: 9,
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: 'WyJmb28iLCJiYXIiXQ==',
        endCursor: 'WyJmb28iLCJiYXIiXQ=='
      },
      edges: [
        {
          node: { foo: 'bar' },
          cursor: 'WyJmb28iLCJiYXIiXQ=='
        }
      ]
    })
  })
})
