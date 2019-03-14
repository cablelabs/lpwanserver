// eslint-disable-next-line no-unused-vars
const assert = require('assert')
// eslint-disable-next-line no-unused-vars
const chai = require('chai')
// eslint-disable-next-line no-unused-vars
const should = chai.should()
const nconf = require('nconf')
const TestModule = require('../../../rest/models/IUser')
const testName = 'User'
const modelAPIMock = require('../../mock/ModelAPI-mock')

function assertUserProps (actual) {
  actual.should.have.property('username')
  actual.should.have.property('email')
  actual.company.should.have.property('id')
  actual.role.should.have.property('id')
  actual.should.have.property('id')
}

describe('Unit Tests for ' + testName, () => {
  let userId = ''
  before('Setup ENV', async () => {
    nconf.file('defaults', { file: 'config/defaults.hjson', format: require('hjson') })
    console.log(nconf.get('impl_directory'))
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
    const actual = await testModule.retrieveUsers()
    actual.should.have.property('totalCount')
    actual.should.have.property('records')
  })
  it(testName + ' Create', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.createUser('testuser', '123456', 'bob@aol.com', 1, 1)
    assertUserProps(actual)
    userId = actual.id
  })
  it(testName + ' Retrieve', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.retrieveUser(userId)
    assertUserProps(actual)
  })
  it(testName + ' Update', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    let updated = {
      id: userId,
      username: 'testuser',
      email: 'bob@aol.com',
      companyId: 1,
      role: 2
    }
    const actual = await testModule.updateUser(updated)
    assertUserProps(actual)
    actual.role.should.equal(updated.role)
  })
})
