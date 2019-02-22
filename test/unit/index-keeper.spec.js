'use strict'

const TestIndexKeeper = require('./fixtures/TestIndexKeeper')

describe('IndexKeeper', () => {
  it('gets the desired engine driver', () => {
    const engineMock = jest.fn()

    const scoutMock = jest.fn()
    scoutMock.engine = jest.fn(() => engineMock)

    const keeper = new TestIndexKeeper(scoutMock)

    expect(scoutMock.engine).toBeCalledWith('null')
    expect(keeper.engine).toBe(engineMock)
  })

  it('up/down should be defined methods', () => {
    const scoutMock = jest.fn()
    scoutMock.engine = jest.fn()

    const keeper = new TestIndexKeeper(scoutMock)

    expect(typeof keeper.up).toEqual('function')
    expect(typeof keeper.down).toEqual('function')
  })

  it('proxy engine methods', () => {
    const engineMock = jest.fn()
    engineMock.createIndex = jest.fn()
    engineMock.deleteIndex = jest.fn()

    const scoutMock = jest.fn()
    scoutMock.engine = jest.fn(() => engineMock)

    const keeper = new TestIndexKeeper(scoutMock)

    keeper.createIndex('foo')
    expect(engineMock.createIndex).toHaveBeenCalledWith('foo')

    keeper.deleteIndex('foo')
    expect(engineMock.deleteIndex).toHaveBeenCalledWith('foo')
  })
})
