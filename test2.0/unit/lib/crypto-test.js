// eslint-disable-next-line no-unused-vars
var assert = require('assert')
// eslint-disable-next-line no-unused-vars
var chai = require('chai')
// eslint-disable-next-line no-unused-vars
var should = chai.should()
var TestModule = require('../../../rest/lib/crypto')
const testName = 'Crypto'

describe('Unit Tests for ' + testName, () => {
  let temp = null
  before('Setup ENV', async () => {
  })
  after('Shutdown', async () => {
  })
  it(testName + ' Hash Password', async () => {
    temp = await TestModule.hashPassword('Test123')
  })
  it(testName + ' Verify Password', async () => {
    const valid = await TestModule.verifyPassword('Test123', temp)
    if (valid) return
    throw new Error('Password Failed')
  })
  it(testName + ' Fail to Verify Password', async () => {
    const valid = await TestModule.verifyPassword('Test456', temp)
    if (!valid) return
    throw new Error('Password Did not fail')
  })
})
