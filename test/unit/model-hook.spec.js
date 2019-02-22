'use strict'

const ModelHook = require('../../src/ModelHook')

describe('ModelHook', () => {
  it('makes model searchable when saved if should be searchable', () => {
    const modelMock = jest.fn()
    modelMock.shouldBeSearchable = jest.fn(() => true)
    modelMock.searchable = jest.fn()
    ModelHook.saved(modelMock)
    expect(modelMock.searchable).toHaveBeenCalledTimes(1)
  })

  it('makes model unsearchable when saved if should NOT be searchable', () => {
    const modelMock = jest.fn()
    modelMock.shouldBeSearchable = jest.fn(() => false)
    modelMock.unsearchable = jest.fn()
    ModelHook.saved(modelMock)
    expect(modelMock.unsearchable).toHaveBeenCalledTimes(1)
  })

  it('makes model unsearchable when deleted', () => {
    const modelMock = jest.fn()
    modelMock.unsearchable = jest.fn()
    ModelHook.deleted(modelMock)
    expect(modelMock.unsearchable).toHaveBeenCalledTimes(1)
  })
})
