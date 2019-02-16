'use strict'

const TestAbstractPaginator = require('./fixtures/TestAbstractPaginator')
const VanillaSerializer = require('@adonisjs/lucid/src/Lucid/Serializers/Vanilla')
describe('AbstractPaginator', () => {
  it('new instance correctly set its initial state', () => {
    const items = new VanillaSerializer([])
    const total = 978

    const paginator = new TestAbstractPaginator(items, total)

    expect(paginator.getCollection()).toBe(items)
    expect(paginator.total).toEqual(total)
  })

  it('items returns collection rows', () => {
    const items = new VanillaSerializer([])
    const paginator = new TestAbstractPaginator(items, 0)

    expect(paginator.items).toBe(items.rows)
  })

  it('isEmpty returns false if there is items in the list', () => {
    const items = new VanillaSerializer([ jest.fn() ])
    const paginator = new TestAbstractPaginator(items, 1)

    expect(paginator.isEmpty()).toBe(false)
  })

  it('count returns the same as the collection size', () => {
    const items = new VanillaSerializer([ jest.fn(), jest.fn() ])
    const paginator = new TestAbstractPaginator(items, 9)

    expect(paginator.count()).toEqual(items.size())
  })

  it('toJSON correctly returns paginator meta and data', () => {
    const modelMock = jest.fn()
    modelMock.toObject = jest.fn(() => ({ foo: 'bar' }))

    const items = new VanillaSerializer([ modelMock ])

    const paginator = new TestAbstractPaginator(items, 9)

    expect(paginator.toJSON()).toEqual({
      total: 9,
      data: [
        { foo: 'bar' }
      ]
    })
  })

  it('proxy collection methods', () => {
    const items = new VanillaSerializer([])
    const paginator = new TestAbstractPaginator(items, 0)

    expect(typeof paginator.first).toBe('function')
    expect(typeof paginator.last).toBe('function')
    expect(typeof paginator.size).toBe('function')
  })
})
