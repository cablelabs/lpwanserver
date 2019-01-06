// eslint-disable-next-line no-unused-vars
const assert = require('assert')
// eslint-disable-next-line no-unused-vars
const chai = require('chai')
// eslint-disable-next-line no-unused-vars
const should = chai.should()
const TestModule = require('../../../rest/reportingProtocols/reportingProtocols')
const modelAPI = require('../../mock/ModelAPI-mock')
const testName = 'Reporting Protocol API'

describe('Unit Tests for ' + testName, () => {
  before('Setup ENV', async () => {
  })
  after('Shutdown', async () => {
  })
  it(testName + ' Construction', (done) => {
    let testModule = new TestModule(modelAPI.reportingProtocols)
    should.exist(testModule)
    should.exist(testModule.rpDB)
    testModule.reportingProtocolMap.should.eql({})
    done()
  })
  it(testName + ' Clear Protocols', (done) => {
    let testModule = new TestModule(modelAPI.reportingProtocols)
    testModule.clearProtocolMap()
    testModule.reportingProtocolMap.should.eql({})
    done()
  })
  it(testName + ' Get Protocol', (done) => {
    let testModule = new TestModule(modelAPI.reportingProtocols)
    testModule.getProtocol({ reportingProtocolId: 1 })
      .then((protocolHandler) => {
        should.exist(protocolHandler)
        testModule.reportingProtocolMap.should.have.property('1')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
  it(testName + ' Get Non Existing Protocol', (done) => {
    let testModule = new TestModule(modelAPI.reportingProtocols)
    testModule.getProtocol({ reportingProtocolId: 2 })
      .then(() => {
        done(new Error('Protocol Should not exist'))
      })
      .catch(() => {
        testModule.reportingProtocolMap.should.eql({})
        done()
      })
  })
})
