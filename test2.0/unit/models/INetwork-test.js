// eslint-disable-next-line no-unused-vars
var assert = require('assert')
// eslint-disable-next-line no-unused-vars
var chai = require('chai')
// eslint-disable-next-line no-unused-vars
var should = chai.should()
var nconf = require('nconf')
var TestModule = require('../../../rest/models/INetwork')
const testName = 'Network'

describe('Unit Tests for ' + testName, () => {
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
  it(testName + ' Empty Retrieval', (done) => {
    let testModule = new TestModule({}, {})
    should.exist(testModule)
    testModule.retrieveNetworks()
      .then(actual => {
        actual.should.have.property('totalCount')
        actual.should.have.property('records')
        actual.totalCount.should.equal(0)
        actual.records.length.should.equal(0)
        done()
      })
      .catch(err => {
        done(err)
      })
  })
})