// eslint-disable-next-line no-unused-vars
var assert = require('assert')
// eslint-disable-next-line no-unused-vars
var chai = require('chai')
// eslint-disable-next-line no-unused-vars
var should = chai.should()
var nconf = require('nconf')
var Initializer = require('../../../rest/models/initializer')
var TestModule = require('../../../rest/models/IApplication')
const testName = 'Application'

describe('Unit Tests for ' + testName, () => {
  before('Setup ENV', async () => {
    nconf.overrides({
      'impl_directory': 'production',
      'db_schema': 'data/lpwanserver.2.2.schema',
      'db_create': false,
      'db_file': 'data/test.sqlite3'
    })
    let initializer = new Initializer()
    initializer.init()
    console.log(nconf.get('impl_directory'))
    console.log(nconf.get('db_schema'))
    console.log(nconf.get('db_create'))
  })
  it(testName + ' Construction', () => {
    let testModule = new TestModule({}, {})
    should.exist(testModule)
  })
  it(testName + ' Empty Retrieval', (done) => {
    let testModule = new TestModule({}, {})
    should.exist(testModule)
    testModule.retrieveApplications()
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
