'use strict'

const LengthPaginator = require('../src/Paginators/LengthAwarePaginator')

describe('LengthAwarePaginator', () => {
  it('new instance correctly set its state', () => {
    const items = jest.fn()
    const total = 978
    const currentPage = 1
    const perPage = 20

    const paginator = new LengthPaginator(items, total, currentPage, perPage)

    expect(paginator.items).toBe(items)
    expect(paginator.total).toEqual(total)
    expect(paginator.currentPage).toEqual(currentPage)
    expect(paginator.perPage).toEqual(perPage)
    expect(paginator.lastPage).toEqual(49)
  })
})
