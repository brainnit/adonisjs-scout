'use strict'

const sinon = require('sinon')
const TestIndexKeeper = require('./fixtures/TestIndexKeeper')

describe('IndexKeeper', () => {
  it('gets the desired engine driver', () => {
    const stub = sinon.stub()
    stub.withArgs('scout.prefix').returns('foo_')
    const configMock = { get: stub }

    const engineMock = jest.fn()
    const scoutMock = jest.fn()
    scoutMock.Config = configMock
    scoutMock.engine = jest.fn(() => engineMock)

    const keeper = new TestIndexKeeper(scoutMock)

    expect(scoutMock.engine).toBeCalledWith('null')
    expect(keeper.engine).toBe(engineMock)
  })

  it('up/down should be defined methods', () => {
    const stub = sinon.stub()
    stub.withArgs('scout.prefix').returns('foo_')
    const configMock = { get: stub }

    const scoutMock = jest.fn()
    scoutMock.Config = configMock
    scoutMock.engine = jest.fn()

    const keeper = new TestIndexKeeper(scoutMock)

    expect(typeof keeper.up).toEqual('function')
    expect(typeof keeper.down).toEqual('function')
  })

  it('proxy engine methods', () => {
    const stub = sinon.stub()
    stub.withArgs('scout.prefix').returns('foo_')
    const configMock = { get: stub }

    const engineMock = jest.fn()
    engineMock.createIndex = jest.fn()
    engineMock.deleteIndex = jest.fn()

    const scoutMock = jest.fn()
    scoutMock.Config = configMock
    scoutMock.engine = jest.fn(() => engineMock)

    const keeper = new TestIndexKeeper(scoutMock)

    keeper.createIndex('bar')
    expect(engineMock.createIndex).toHaveBeenCalledWith('foo_bar')

    keeper.deleteIndex('bar')
    expect(engineMock.deleteIndex).toHaveBeenCalledWith('foo_bar')
  })
})
