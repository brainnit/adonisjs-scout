'use strict'

const SearchRule = require('../../src/SearchRule')
const { LogicalException } = require('../../src/Exceptions')

describe('SearchRule', () => {
  it('throws exception if constructed', () => {
    const fn = () => { return new SearchRule() }
    expect(fn).toThrow(TypeError)
  })

  it('methods throw exception if not implemented', () => {
    const searchRuleStub = new SearchRuleStub()
    expect(() => searchRuleStub.buildQuery()).toThrow(LogicalException)
  })
})

class SearchRuleStub extends SearchRule {}
