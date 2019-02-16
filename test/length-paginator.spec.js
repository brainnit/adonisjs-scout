'use strict'

const LengthPaginator = require('../src/Paginators/LengthAwarePaginator')
const VanillaSerializer = require('@adonisjs/lucid/src/Lucid/Serializers/Vanilla')

describe('LengthAwarePaginator', () => {
  it('new instance correctly set its initial state', () => {
    const items = new VanillaSerializer([])
    const total = 978
    const currentPage = 1
    const perPage = 20

    const paginator = new LengthPaginator(items, total, currentPage, perPage)

    expect(paginator.currentPage).toEqual(currentPage)
    expect(paginator.perPage).toEqual(perPage)
    expect(paginator.lastPage).toEqual(49)
  })

  it('onFirstPage returns true if current page is first', () => {
    const items = new VanillaSerializer([])
    const paginator = new LengthPaginator(items, 0, 1, 10)

    expect(paginator.onFirstPage()).toBe(true)
  })

  it('onFirstPage returns false if current page is not first', () => {
    const items = new VanillaSerializer([])
    const paginator = new LengthPaginator(items, 90, 2, 10)

    expect(paginator.onFirstPage()).toBe(false)
  })

  it('onLastPage returns false if current page is last', () => {
    const items = new VanillaSerializer([])
    const paginator = new LengthPaginator(items, 0, 1, 10)

    expect(paginator.onLastPage()).toBe(true)
  })

  it('onLastPage returns false if current page is not last', () => {
    const items = new VanillaSerializer([])
    const paginator = new LengthPaginator(items, 90, 1, 10)

    expect(paginator.onLastPage()).toBe(false)
  })

  it('hasPreviousPage returns true if not on first page', () => {
    const items = new VanillaSerializer([])
    const paginator = new LengthPaginator(items, 90, 2, 10)

    expect(paginator.hasPreviousPage()).toBe(true)
  })

  it('hasPreviousPage returns false if on first page', () => {
    const items = new VanillaSerializer([])
    const paginator = new LengthPaginator(items, 90, 1, 10)

    expect(paginator.hasPreviousPage()).toBe(false)
  })

  it('hasNextPage returns true if not on last page', () => {
    const items = new VanillaSerializer([])
    const paginator = new LengthPaginator(items, 90, 2, 10)

    expect(paginator.hasNextPage()).toBe(true)
  })

  it('hasNextPage returns false if on last page', () => {
    const items = new VanillaSerializer([])
    const paginator = new LengthPaginator(items, 90, 9, 10)

    expect(paginator.hasNextPage()).toBe(false)
  })

  it('toJSON correctly returns paginator meta and data', () => {
    const modelMock = jest.fn()
    modelMock.toObject = jest.fn(() => ({ foo: 'bar' }))

    const items = new VanillaSerializer([ modelMock ])
    const paginator = new LengthPaginator(items, 90, 1, 10)

    expect(paginator.toJSON()).toEqual({
      total: 90,
      perPage: 10,
      lastPage: 9,
      currentPage: 1,
      hasPreviousPage: false,
      hasNextPage: true,
      data: [
        { foo: 'bar' }
      ]
    })
  })
})
