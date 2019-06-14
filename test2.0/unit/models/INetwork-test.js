// eslint-disable-next-line no-unused-vars
const assert = require('assert')
// eslint-disable-next-line no-unused-vars
const chai = require('chai')
// eslint-disable-next-line no-unused-vars
const should = chai.should()
const { prisma } = require('../../../prisma/generated/prisma-client')
const TestModule = require('../../../rest/models/INetwork')
const NetworkProviderModule = require('../../../rest/models/INetworkProvider')
const NetworkProtocolModule = require('../../../rest/models/INetworkProtocol')
const modelAPIMock = require('../../mock/ModelAPI-mock')

const testName = 'Network'

function assertNetworkProps (actual) {
  actual.should.have.property('name')
  actual.networkProvider.should.have.property('id')
  actual.networkType.should.have.property('id')
  actual.networkProtocol.should.have.property('id')
  actual.should.have.property('baseUrl')
  actual.should.have.property('securityData')
  actual.should.have.property('id')
}

describe('Unit Tests for ' + testName, () => {
  let networkId = ''
  let networkProtocolId = ''
  let networkProviderId = ''
  before('Setup ENV', async () => {
    // create network protocol and NetworkProvider
    const ntwkProtocolModule = new NetworkProtocolModule(modelAPIMock)
    const ntwkProviderModule = new NetworkProviderModule(modelAPIMock)
    const nwkTypes = await prisma.networkTypes()
    let result = await ntwkProtocolModule.create('test', nwkTypes[0].id)
    networkProtocolId = result.id
    result = await ntwkProviderModule.create('test')
    networkProviderId = result.id
  })
  after('Shutdown', async () => {
  })
  it(testName + ' Construction', () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
  })
  it(testName + ' Empty Retrieval', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.list()
    actual.should.have.length(2)
  })
  it(testName + ' Create', async () => {
    const nwkTypes = await prisma.networkTypes()
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    let body = {
      name: 'tests',
      networkProviderId,
      networkTypeId: nwkTypes[0].id,
      networkProtocolId,
      baseUrl: 'http://localhost:6000',
      securityData: {}
    }
    const actual = await testModule.create(body)
    assertNetworkProps(actual)
    networkId = actual.id
  })
  it(testName + ' Retrieve', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.load(networkId)
    assertNetworkProps(actual)
  })
  it(testName + ' Update', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    let updated = {
      id: networkId,
      name: 'test',
      baseUrl: 'http://localhost:7000'
    }
    const actual = await testModule.update(updated)
    assertNetworkProps(actual)
    actual.baseUrl.should.equal(updated.baseUrl)
  })
})
