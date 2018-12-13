// eslint-disable-next-line no-unused-vars
var assert = require('assert')
// eslint-disable-next-line no-unused-vars
var chai = require('chai')
// eslint-disable-next-line no-unused-vars
var should = chai.should()
var nconf = require('nconf')
var TestModule = require('../../../rest/models/IUser')
const testName = 'User'

describe('Unit Tests for ' + testName, () => {
  before('Create Network', async () => {
    nconf.overrides({
      'impl_directory': 'production'
    })

  })
  it('Test Application Construction', () => {
    let testModule = new TestModule({}, {})
    should.exist(testModule)
  })
  it(testName + ' Empty Retrieval', (done) => {
    let testModule = new TestModule({}, {})
    should.exist(testModule)
    testModule.retrieveUsers()
      .then(actual => {
        actual.should.have.property('totalCount')
        actual.should.have.property('records')
        actual.totalCount.should.equal(1)
        actual.records.length.should.equal(1)
        done()
      })
      .catch(err => {
        done(err)
      })
  })
})