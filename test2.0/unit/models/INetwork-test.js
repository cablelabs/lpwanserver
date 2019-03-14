// eslint-disable-next-line no-unused-vars
const assert = require('assert')
// eslint-disable-next-line no-unused-vars
const chai = require('chai')
// eslint-disable-next-line no-unused-vars
const should = chai.should()
const nconf = require('nconf')
const TestModule = require('../../../rest/models/INetwork')
const NetworkProviderModule = require('../../../rest/models/INetworkProvider')
const NetworkProtocolModule = require('../../../rest/models/INetworkProtocol')
const testName = 'Network'
const modelAPIMock = require('../../mock/ModelAPI-mock')

function assertNetworkProps (actual) {
  console.log("NETWORK", JSON.stringify(actual))
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
    nconf.file('defaults', { file: 'config/defaults.hjson', format: require('hjson') })
    // create network protocol and NetworkProvider
    const ntwkProtocolModule = new NetworkProtocolModule(modelAPIMock)
    const ntwkProviderModule = new NetworkProviderModule(modelAPIMock)
    let result = await ntwkProtocolModule.createNetworkProtocol('test', 1)
    networkProtocolId = result.id
    result = await ntwkProviderModule.createNetworkProvider('test')
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
    const actual = await testModule.retrieveNetworks()
    actual.should.have.property('totalCount')
    actual.should.have.property('records')
  })
  it(testName + ' Create', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.createNetwork('tests', networkProviderId, 1, networkProtocolId, 'http://localhost:6000', {})
    assertNetworkProps(actual)
    networkId = actual.id
  })
  it(testName + ' Retrieve', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.retrieveNetwork(networkId, 'internal')
    assertNetworkProps(actual)
  })
  it(testName + ' Update', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    let updated = {
      id: networkId,
      name: 'test',
      networkTypeId: 1,
      networkProviderId: 1,
      networkProtocolId: 1,
      baseUrl: 'http://localhost:7000'
    }
    const actual = await testModule.updateNetwork(updated, 'internal')
    assertNetworkProps(actual)
    actual.baseUrl.should.equal(updated.baseUrl)
  })
})
