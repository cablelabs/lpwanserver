// eslint-disable-next-line no-unused-vars
const assert = require('assert')
// eslint-disable-next-line no-unused-vars
const chai = require('chai')
// eslint-disable-next-line no-unused-vars
const should = chai.should()
const nconf = require('nconf')
const Initializer = require('../../../rest/models/initializer')
const TestModule = require('../../../rest/models/IDeviceProfile')
const testName = 'DeviceProfile'

const modelAPIMock = {
  networks: {
    async retrieveNetwork (networkId) {
      return {
        networkId: 1,
        networkProtocolId: 1
      }
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
  }
}

describe('Unit Tests for ' + testName, () => {
  let deviceProfileId = ''
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
    testModule.retrieveDeviceProfiles()
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
    testModule.createDeviceProfile(1, 1, 'test', 'test description')
      .then(actual => {
        actual.should.have.property('name')
        actual.should.have.property('description')
        actual.should.have.property('networkTypeId')
        actual.should.have.property('companyId')
        actual.should.have.property('id')
        deviceProfileId = actual.id
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it(testName + ' Retrieve', (done) => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    testModule.retrieveDeviceProfile(deviceProfileId)
      .then(actual => {
        actual.should.have.property('name')
        actual.should.have.property('description')
        actual.should.have.property('networkTypeId')
        actual.should.have.property('companyId')
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
      id: deviceProfileId,
      name: 'test',
      description: 'updated description',
      networkTypeId: 1,
      companyId: 1
    }
    testModule.updateDeviceProfile(updated)
      .then(actual => {
        actual.should.have.property('name')
        actual.should.have.property('description')
        actual.should.have.property('networkTypeId')
        actual.should.have.property('companyId')
        actual.should.have.property('id')
        actual.description.should.equal(updated.description)
        done()
      })
      .catch(err => {
        done(err)
      })
  })
})
