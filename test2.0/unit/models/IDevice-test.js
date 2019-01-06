// eslint-disable-next-line no-unused-vars
const assert = require('assert')
// eslint-disable-next-line no-unused-vars
const chai = require('chai')
// eslint-disable-next-line no-unused-vars
const should = chai.should()
const nconf = require('nconf')
const Initializer = require('../../../rest/models/initializer')
const TestModule = require('../../../rest/models/IDevice')
const testName = 'Device'

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
  }
}

describe('Unit Tests for ' + testName, () => {
  let deviceId = ''
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
    testModule.retrieveDevices()
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
    testModule.createDevice('test', 'test application', '1', 'AR1')
      .then(actual => {
        actual.should.have.property('name')
        actual.should.have.property('description')
        actual.should.have.property('applicationId')
        actual.should.have.property('deviceModel')
        actual.should.have.property('id')
        deviceId = actual.id
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it(testName + ' Retrieve', (done) => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    testModule.retrieveDevice(deviceId)
      .then(actual => {
        actual.should.have.property('name')
        actual.should.have.property('description')
        actual.should.have.property('applicationId')
        actual.should.have.property('deviceModel')
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
      id: deviceId,
      name: 'test',
      description: 'updated description',
      applicationId: 1,
      deviceModel: 'AR2'
    }
    testModule.updateDevice(updated)
      .then(actual => {
        actual.should.have.property('name')
        actual.should.have.property('description')
        actual.should.have.property('applicationId')
        actual.should.have.property('deviceModel')
        actual.should.have.property('id')
        actual.description.should.equal(updated.description)
        actual.deviceModel.should.equal(updated.deviceModel)
        done()
      })
      .catch(err => {
        done(err)
      })
  })
})
