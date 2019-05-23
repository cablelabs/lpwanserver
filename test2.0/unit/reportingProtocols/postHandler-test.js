// eslint-disable-next-line no-unused-vars
var assert = require('assert')
// eslint-disable-next-line no-unused-vars
var chai = require('chai')
// eslint-disable-next-line no-unused-vars
var should = chai.should()
var TestModule = require('../../../rest/reportingProtocols/postHandler')
const testName = 'Post Handler'
const { promisify } = require('util')

// content of index.js
const http = require('http')
const port = 5000

const requestHandler = (request, response) => {
  console.log(request.url)
  response.statusCode = 201
  response.end(JSON.stringify({ message: 'Hello Client' }))
}

const server = http.createServer(requestHandler)
const serverListen = promisify(server.listen.bind(server))
const serverClose = promisify(server.close.bind(server))

describe('Unit Tests for ' + testName, () => {
  before('Setup ENV', async () => {
    await serverListen(port)
  })
  after('Shutdown', async () => {
    await serverClose()
  })
  it(testName + ' Report', async () => {
    let dataObject = { name: 'Hello App' }
    const actual = await (new TestModule()).report(dataObject, 'http://localhost:5000', 'test')
    actual.statusCode.should.equal(201)
    actual.body.message.should.equal('Hello Client')
  })
  it(testName + ' Report Empty', async () => {
    const actual = await (new TestModule()).report(null, 'http://localhost:5000', 'test')
    actual.statusCode.should.equal(201)
    actual.body.message.should.equal('Hello Client')
  })
  it(testName + ' Report No App', async () => {
    let dataObject = { name: 'Hello App' }
    const actual = await (new TestModule()).report(dataObject, 'http://localhost:5000')
    actual.statusCode.should.equal(201)
    actual.body.message.should.equal('Hello Client')
  })
  it(testName + ' Report Incorrect URL', async () => {
    let dataObject = { name: 'Hello App' }
    try {
      await (new TestModule()).report(dataObject, 'http://localhost:6000', 'test')
      throw new Error('Should not connect to incorrect url')
    }
    catch (err) {
      err.message.should.equal('connect ECONNREFUSED 127.0.0.1:6000')
    }
  })
})
