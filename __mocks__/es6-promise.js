// ./__mocks__/es6-promise.js
import JestMockPromise from 'jest-mock-promise'

// mocking the es6-promise, which is used by component we are testing
export { JestMockPromise as Promise }
