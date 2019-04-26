// eslint-disable-next-line no-unused-vars
var assert = require('assert')
// eslint-disable-next-line no-unused-vars
var chai = require('chai')
// eslint-disable-next-line no-unused-vars
var should = chai.should()

var { Application: TestModule } = require('../../../rest/models/IApplication')
const modelAPIMock = require('../../mock/ModelAPI-mock')

const testName = 'Application'

// content of index.js
const http = require('http')
const port = 5000

const requestHandler = (request, response) => {
  console.log(request.url)
  response.statusCode = 201
  response.end(JSON.stringify({}))
}

const server = http.createServer(requestHandler)

function assertAppProps (actual) {
  actual.should.have.property('name')
  actual.should.have.property('description')
  actual.company.should.have.property('id')
  actual.reportingProtocol.should.have.property('id')
  actual.should.have.property('baseUrl')
  actual.should.have.property('id')
}

describe('Unit Tests for ' + testName, () => {
  let appId = ''
  before('Setup ENV', done => {
    server.listen(port, (err) => {
      if (err) return done(err)
      done()
    })
  })
  after('Shutdown', async () => {
    server.close()
  })
  it(testName + ' Construction', () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
  })
  it(testName + ' Empty Retrieval', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.retrieveApplications()
    actual.should.have.property('totalCount')
    actual.should.have.property('records')
  })
  it(testName + ' Create', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.createApplication({
      name: 'test',
      description: 'test application',
      companyId: 1,
      reportingProtocolId: 1,
      baseUrl: 'http://localhost:5000'
    })
    assertAppProps(actual)
    appId = actual.id
  })
  it(testName + ' Retrieve', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.retrieveApplication(appId)
    assertAppProps(actual)
  })
  it(testName + ' Update', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    let updated = {
      id: appId,
      name: 'test',
      description: 'updated description',
      companyId: 1,
      reportingProtocolId: 1,
      baseUrl: 'http://localhost:5000'
    }
    const actual = await testModule.updateApplication(updated)
    assertAppProps(actual)
    actual.description.should.equal(updated.description)
  })
  it(testName + ' Start', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.startApplication(appId)
    console.log(actual)
  })
  it(testName + ' Test', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.testApplication(appId, { name: 'test' })
    console.log(actual)
  })
  it.skip(testName + ' Pass Data to Application', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.passDataToApplication(appId, 1, { name: 'test' })
    actual.should.be(204)
  })
  it(testName + ' Stop', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.stopApplication(appId)
    console.log(actual)
  })
})
