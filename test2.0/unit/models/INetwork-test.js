// eslint-disable-next-line no-unused-vars
const assert = require('assert')
// eslint-disable-next-line no-unused-vars
const chai = require('chai')
// eslint-disable-next-line no-unused-vars
const should = chai.should()
const nconf = require('nconf')
const Initializer = require('../../../rest/models/initializer')
const TestModule = require('../../../rest/models/INetwork')
const testName = 'Network'
var cry = require('crypto')
var k = cry.randomBytes(32)

const modelAPIMock = {
  networks: {
    async retrieveNetwork (networkId) {
      return {
        networkId: 1,
        networkProtocolId: 1
      }
    }
  },
  networkProtocols: {
    async retrieveNetworkProtocol (networkProtocolId) {
      return ({})
    }
  },
  networkProtocolAPI: {
    async getProtocol (network) {
      return {
        sessionData: {},
        api: require('../../../rest/networkProtocols/LoRaOpenSource_2.js')
      }
    }
  },
  networkTypeAPI: {
    async addDeviceProfile (nwkId, dpId) {
      return ({})
    },
    async pushDeviceProfile (nwkId, dpId) {
      return ({})
    }
  },
  protocolData: {
    async retrieveProtocolData (networkId, networkProtocolId, key) {
      return (k.toString('base64'))
    }
  }
}

describe('Unit Tests for ' + testName, () => {
  let networkId = ''
  before('Setup ENV', async () => {
    nconf.file('defaults', { file: 'config/defaults.hjson', format: require('hjson') })
    let initializer = new Initializer()
    initializer.init()
    console.log(nconf.get('impl_directory'))
    console.log(nconf.get('db_schema'))
    console.log(nconf.get('db_create'))
  })
  after('Shutdown', async () => {
  })
  it(testName + ' Construction', () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
  })
  it(testName + ' Empty Retrieval', (done) => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    testModule.retrieveNetworks()
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
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    testModule.createNetwork('tests', 1, 1, 1, 'http://localhost:6000', {})
      .then(actual => {
        actual.should.have.property('name')
        actual.should.have.property('networkProviderId')
        actual.should.have.property('networkTypeId')
        actual.should.have.property('networkProtocolId')
        actual.should.have.property('baseUrl')
        actual.should.have.property('securityData')
        actual.should.have.property('id')
        networkId = actual.id
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it(testName + ' Retrieve', (done) => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    testModule.retrieveNetwork(networkId)
      .then(actual => {
        actual.should.have.property('name')
        actual.should.have.property('networkProviderId')
        actual.should.have.property('networkTypeId')
        actual.should.have.property('networkProtocolId')
        actual.should.have.property('baseUrl')
        actual.should.have.property('securityData')
        actual.should.have.property('id')
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it(testName + ' Update', (done) => {
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
    testModule.updateNetwork(updated)
      .then(actual => {
        actual.should.have.property('name')
        actual.should.have.property('networkProviderId')
        actual.should.have.property('networkTypeId')
        actual.should.have.property('networkProtocolId')
        actual.should.have.property('baseUrl')
        actual.should.have.property('securityData')
        actual.should.have.property('id')
        actual.baseUrl.should.equal(updated.baseUrl)
        done()
      })
      .catch(err => {
        done(err)
      })
  })
})
