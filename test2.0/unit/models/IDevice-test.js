// eslint-disable-next-line no-unused-vars
const assert = require('assert')
// eslint-disable-next-line no-unused-vars
const chai = require('chai')
// eslint-disable-next-line no-unused-vars
const should = chai.should()

const TestModule = require('../../../rest/models/IDevice')
const modelAPIMock = require('../../mock/ModelAPI-mock')

const testName = 'Device'

function assertDeviceProps (actual) {
  actual.should.have.property('name')
  actual.should.have.property('description')
  actual.application.should.have.property('id')
  actual.should.have.property('deviceModel')
  actual.should.have.property('id')
}

describe('Unit Tests for ' + testName, () => {
  let deviceId = ''
  before('Setup ENV', async () => {})
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
    actual.should.have.property('totalCount')
    actual.should.have.property('records')
  })
  it(testName + ' Create', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.create('test', 'test application', 1, 'AR1')
    assertDeviceProps(actual)
    deviceId = actual.id
  })
  it(testName + ' Retrieve', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.load(deviceId)
    assertDeviceProps(actual)
  })
  it(testName + ' Update', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    let updated = {
      id: deviceId,
      name: 'test',
      description: 'updated description',
      applicationId: 1,
      deviceModel: 'AR2'
    }
    const actual = await testModule.update(updated)
    assertDeviceProps(actual)
    actual.description.should.equal(updated.description)
    actual.deviceModel.should.equal(updated.deviceModel)
  })
})
