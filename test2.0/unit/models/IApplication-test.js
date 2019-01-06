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
const modelAPIMock = require('../ModelAPI-mock')

// content of index.js
const http = require('http')
const port = 5000

const requestHandler = (request, response) => {
  console.log(request.url)
  response.statusCode = 201
  response.end(JSON.stringify({}))
}

const server = http.createServer(requestHandler)

describe('Unit Tests for ' + testName, () => {
  let appId = ''
  before('Setup ENV', async () => {
    nconf.file('defaults', { file: 'config/defaults.hjson', format: require('hjson') })
    let initializer = new Initializer()
    initializer.init()
    console.log(nconf.get('impl_directory'))
    console.log(nconf.get('db_schema'))
    console.log(nconf.get('db_create'))
    server.listen(port, (err) => {
      if (err) console.log('Server Error')
    })
  })
  after('Shutdown', async () => {
    server.close()
  })
  it(testName + ' Construction', () => {
    let testModule = new TestModule({}, modelAPIMock)
    should.exist(testModule)
  })
  it(testName + ' Empty Retrieval', (done) => {
    let testModule = new TestModule({}, modelAPIMock)
    should.exist(testModule)
    testModule.retrieveApplications()
      .then(actual => {
        actual.should.have.property('totalCount')
        actual.should.have.property('records')
        // actual.totalCount.should.equal(0)
        // actual.records.length.should.equal(0)
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it(testName + ' Create', (done) => {
    let testModule = new TestModule({}, modelAPIMock)
    should.exist(testModule)
    testModule.createApplication('test', 'test application', 1, 1, 'http://localhost:5000')
      .then(actual => {
        actual.should.have.property('name')
        actual.should.have.property('description')
        actual.should.have.property('companyId')
        actual.should.have.property('reportingProtocolId')
        actual.should.have.property('baseUrl')
        actual.should.have.property('id')
        appId = actual.id
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it(testName + ' Retrieve', (done) => {
    let testModule = new TestModule({}, modelAPIMock)
    should.exist(testModule)
    testModule.retrieveApplication(appId)
      .then(actual => {
        actual.should.have.property('name')
        actual.should.have.property('description')
        actual.should.have.property('companyId')
        actual.should.have.property('reportingProtocolId')
        actual.should.have.property('baseUrl')
        actual.should.have.property('id')
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it(testName + ' Update', (done) => {
    let testModule = new TestModule({}, modelAPIMock)
    should.exist(testModule)
    let updated = {
      id: appId,
      name: 'test',
      description: 'updated description',
      companyId: 1,
      reportingProtocolId: 1,
      baseUrl: 'http://localhost:5000'
    }
    testModule.updateApplication(updated)
      .then(actual => {
        actual.should.have.property('name')
        actual.should.have.property('description')
        actual.should.have.property('companyId')
        actual.should.have.property('reportingProtocolId')
        actual.should.have.property('baseUrl')
        actual.should.have.property('id')
        actual.description.should.equal(updated.description)
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it(testName + ' Start', (done) => {
    let testModule = new TestModule({}, modelAPIMock)
    should.exist(testModule)
    testModule.startApplication(appId)
      .then(actual => {
        console.log(actual)
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it(testName + ' Test', (done) => {
    let testModule = new TestModule({}, modelAPIMock)
    should.exist(testModule)
    testModule.testApplication(appId, { name: 'test' })
      .then(actual => {
        console.log(actual)
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it.skip(testName + ' Pass Data to Application', (done) => {
    let testModule = new TestModule({}, modelAPIMock)
    should.exist(testModule)
    testModule.passDataToApplication(appId, 1, { name: 'test' })
      .then(actual => {
        console.log(actual)
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it(testName + ' Stop', (done) => {
    let testModule = new TestModule({}, modelAPIMock)
    should.exist(testModule)
    testModule.stopApplication(appId)
      .then(actual => {
        console.log(actual)
        done()
      })
      .catch(err => {
        done(err)
      })
  })
})
