// eslint-disable-next-line no-unused-vars
var assert = require('assert')
// eslint-disable-next-line no-unused-vars
var chai = require('chai')
// eslint-disable-next-line no-unused-vars
var should = chai.should()
var TestModule = require('../../../rest/reportingProtocols/postHandler')
const testName = 'Post Handler'

// content of index.js
const http = require('http')
const port = 5000

const requestHandler = (request, response) => {
  console.log(request.url)
  response.statusCode = 201
  response.end(JSON.stringify({ message: 'Hello Client' }))
}

const server = http.createServer(requestHandler)

describe('Unit Tests for ' + testName, () => {
  before('Setup ENV', async () => {
    server.listen(port, (err) => {})
  })
  after('Shutdown', async () => {
    server.close()
  })
  it(testName + ' Report', (done) => {
    let dataObject = { name: 'Hello App' }
    TestModule.report(dataObject, 'http://localhost:5000', 'test')
      .then(actual => {
        actual.statusCode.should.equal(201)
        actual.body.message.should.equal('Hello Client')
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it(testName + ' Report Empty', (done) => {
    TestModule.report(null, 'http://localhost:5000', 'test')
      .then(actual => {
        actual.statusCode.should.equal(201)
        actual.body.message.should.equal('Hello Client')
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it(testName + ' Report No App', (done) => {
    let dataObject = { name: 'Hello App' }
    TestModule.report(dataObject, 'http://localhost:5000')
      .then(actual => {
        actual.statusCode.should.equal(201)
        actual.body.message.should.equal('Hello Client')
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it(testName + ' Report Incorrect URL', (done) => {
    let dataObject = { name: 'Hello App' }
    TestModule.report(dataObject, 'http://localhost:6000', 'test')
      .then(actual => {
        done(new Error('Should not connect to incorrect url'))
      })
      .catch(err => {
        err.message.should.equal('connect ECONNREFUSED 127.0.0.1:6000')
        done()
      })
  })
})
