// eslint-disable-next-line no-unused-vars
var assert = require('assert')
// eslint-disable-next-line no-unused-vars
var chai = require('chai')
// eslint-disable-next-line no-unused-vars
var should = chai.should()
var nconf = require('nconf')
var TestModule = require('../../../rest/models/IUser')
const testName = 'Network'

describe('I Unit Tests for ' + testName, () => {
  before('Create Network', async () => {
    nconf.overrides({
      'impl_directory': 'production'
    })

  })
  it('Test Application Construction', () => {
    let testModule = new TestModule({}, {})
    should.exist(testModule)
  })
})