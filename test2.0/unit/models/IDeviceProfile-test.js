// eslint-disable-next-line no-unused-vars
const assert = require('assert')
// eslint-disable-next-line no-unused-vars
const chai = require('chai')
// eslint-disable-next-line no-unused-vars
const should = chai.should()

const TestModule = require('../../../rest/models/IDeviceProfile')
const testName = 'DeviceProfile'
const modelAPIMock = require('../../mock/ModelAPI-mock')

function assertDeviceProfileProps (actual) {
  actual.should.have.property('name')
  actual.should.have.property('description')
  actual.networkType.should.have.property('id')
  actual.company.should.have.property('id')
  actual.should.have.property('id')
}

describe('Unit Tests for ' + testName, () => {
  let deviceProfileId = ''
  before('Setup ENV', async () => {})
  after('Shutdown', async () => {})
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
    const actual = await testModule.create(1, 1, 'test', 'test description')
    assertDeviceProfileProps(actual)
    deviceProfileId = actual.id
  })
  it(testName + ' Retrieve', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.load(deviceProfileId)
    assertDeviceProfileProps(actual)
  })
  it(testName + ' Update', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    let updated = {
      id: deviceProfileId,
      name: 'test',
      description: 'updated description',
      networkTypeId: 1,
      companyId: 1
    }
    const actual = await testModule.update(updated)
    assertDeviceProfileProps(actual)
    actual.description.should.equal(updated.description)
  })
})
