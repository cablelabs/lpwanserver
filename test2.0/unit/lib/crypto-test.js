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
  it(testName + ' Hash Password', (done) => {
    TestModule.hashPassword('Test123', (err, hash) => {
      if (err) done(err)
      temp = hash
      done()
    })
  })
  it(testName + ' Verify Password', (done) => {
    TestModule.verifyPassword('Test123', temp, (err, valid) => {
      if (err) done(err)
      if (!valid) done(new Error('Password Failed'))
      else done()
    })
  })
  it(testName + ' Fail to Verify Password', (done) => {
    TestModule.verifyPassword('Test456', temp, (err, valid) => {
      if (err) done(err)
      if (valid) done(new Error('Password Did not fail'))
      else done()
    })
  })
})
