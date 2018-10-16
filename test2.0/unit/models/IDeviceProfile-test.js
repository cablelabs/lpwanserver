// eslint-disable-next-line no-unused-vars
var assert = require('assert')
// eslint-disable-next-line no-unused-vars
var chai = require('chai')
// eslint-disable-next-line no-unused-vars
var should = chai.should()
var nconf = require('nconf')
var TestModule = require('../../../rest/models/IDeviceProfile')
const testName = 'DeviceProfile'

describe('I Unit Tests for ' + testName, () => {
  before('Create Network', async () => {
    nconf.overrides({
      'impl_directory': 'production'
    })
    console.log(nconf.get('impl_directory'))

  })
  it('Test Application Construction', () => {
    let testModule = new TestModule({}, {})
    should.exist(testModule)
  })
})