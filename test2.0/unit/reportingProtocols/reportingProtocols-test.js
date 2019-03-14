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
  it(testName + ' Construction', async () => {
    let testModule = new TestModule(modelAPI.reportingProtocols)
    should.exist(testModule)
    should.exist(testModule.rpDB)
    testModule.reportingProtocolMap.should.eql({})
  })
  it(testName + ' Clear Protocols', async () => {
    let testModule = new TestModule(modelAPI.reportingProtocols)
    testModule.clearProtocolMap()
    testModule.reportingProtocolMap.should.eql({})
  })
  it(testName + ' Get Protocol', async () => {
    let testModule = new TestModule(modelAPI.reportingProtocols)
    const protocolHandler = await testModule.getProtocol({ reportingProtocol: { id: 1 } })
    should.exist(protocolHandler)
    testModule.reportingProtocolMap.should.have.property('1')
  })
  it(testName + ' Get Non Existing Protocol', async () => {
    let testModule = new TestModule(modelAPI.reportingProtocols)
    try {
      await testModule.getProtocol()
      throw new Error('Protocol Should not exist')
    }
    catch (err) {
      testModule.reportingProtocolMap.should.eql({})
    }
  })
})
