'use strict'

const GlobalSearchableScopes = require('../../src/GlobalSearchableScopes')

describe('GlobalSearchableScopes', () => {
  it('throw exception when callback is not a function', () => {
    const globalSearchableScope = new GlobalSearchableScopes()
    const fn = () => globalSearchableScope.add({})
    expect(fn).toThrow('E_INVALID_PARAMETER: Model.addGlobalSearchableScope expects a closure as first parameter')
  })

  it('throw exception when name is defined but not a string', () => {
    const globalSearchableScope = new GlobalSearchableScopes()
    const fn = () => globalSearchableScope.add(() => {}, {})
    expect(fn).toThrow('E_INVALID_PARAMETER: Model.addGlobalSearchableScope expects a string for the scope name')
  })

  it('throw exception when name is defined but not a string', () => {
    const fn = function () {}

    const globalSearchableScope = new GlobalSearchableScopes()
    globalSearchableScope.add(fn)

    expect(globalSearchableScope.scopes).toContainEqual({ callback: fn, name: null })
  })

  it('add a new callback to the store with a unique name', () => {
    const fn = function () {}

    const globalSearchableScope = new GlobalSearchableScopes()
    globalSearchableScope.add(fn, 'foo')

    expect(globalSearchableScope.scopes).toContainEqual({ callback: fn, name: 'foo' })
  })

  it('throw exception when another scope with the same name already exists', () => {
    const globalSearchableScope = new GlobalSearchableScopes()
    globalSearchableScope.add(() => {}, 'foo')
    const fn = () => globalSearchableScope.add(() => {}, 'foo')

    expect(fn).toThrow('E_RUNTIME_ERROR: A scope with name foo alredy exists. Give your scope a unique name')
  })

  it('do not throw exception when name is null for multiple scopes', () => {
    const globalSearchableScope = new GlobalSearchableScopes()
    globalSearchableScope.add(() => {})
    globalSearchableScope.add(() => {})

    expect(globalSearchableScope.scopes).toHaveLength(2)
  })

  it('return an instance of iterator to execute scopes', () => {
    const globalSearchableScope = new GlobalSearchableScopes()
    globalSearchableScope.add(() => {})
    const iterator = globalSearchableScope.iterator()

    expect(iterator._scopes).toEqual(globalSearchableScope.scopes)
  })

  it('execute all scope callbacks with the builder', () => {
    expect.assertions(1)

    const builder = {}
    const globalSearchableScope = new GlobalSearchableScopes()
    globalSearchableScope.add(__builder__ => {
      expect(__builder__).toEqual(builder)
    })

    const iterator = globalSearchableScope.iterator()
    iterator.execute(builder)
  })

  it('ignore all scopes when ignore method is called without any arguments', () => {
    expect.assertions(0)
    const builder = {}

    const globalSearchableScope = new GlobalSearchableScopes()
    globalSearchableScope.add(() => expect().toEqual('Never to be called'), 'foo')

    const iterator = globalSearchableScope.iterator()
    iterator.ignore().execute(builder)
  })

  it('ignore selected scopes by name', () => {
    expect.assertions(1)
    const builder = {}

    const globalSearchableScope = new GlobalSearchableScopes()
    globalSearchableScope.add(() => expect().toEqual('Never to be called'), 'foo')

    globalSearchableScope.add(__builder__ => expect(__builder__).toEqual(builder), 'bar')

    const iterator = globalSearchableScope.iterator()
    iterator.ignore(['foo']).execute(builder)
  })

  it('throw exception when argument passed to ignore is not an array', () => {
    const globalSearchableScope = new GlobalSearchableScopes()
    const iterator = globalSearchableScope.iterator()
    const fn = () => iterator.ignore('foo')
    expect(fn).toThrow('E_INVALID_PARAMETER: ignoreScopes expects an array of names to ignore')
  })

  it('do not execute scopes more than once', () => {
    expect.assertions(1)
    const builder = {}

    const globalSearchableScope = new GlobalSearchableScopes()
    globalSearchableScope.add(__builder__ => {
      expect(__builder__).toEqual(builder)
    })

    const iterator = globalSearchableScope.iterator()
    iterator.execute(builder)
    iterator.execute(builder)
  })
})
