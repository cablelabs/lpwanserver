// eslint-disable-next-line no-unused-vars
var assert = require('assert')
// eslint-disable-next-line no-unused-vars
var chai = require('chai')
// eslint-disable-next-line no-unused-vars
var should = chai.should()
var TestModule = require('../../../rest/lib/appLogger')
const testName = 'AppLogger'

describe('Unit Tests for ' + testName, () => {
  before('Setup ENV', async () => {
  })
  after('Shutdown', async () => {
  })
  it(testName + ' Error Log', (done) => {
    TestModule.log('Test123', 'error')
    done()
  })
  it(testName + ' Warn Log', (done) => {
    TestModule.log('Test123', 'warn')
    done()
  })
  it(testName + ' Info Log', (done) => {
    TestModule.log('Test123', 'info')
    done()
  })
  it(testName + ' Debug Log', (done) => {
    TestModule.log('Test123', 'debug')
    done()
  })
})
