// eslint-disable-next-line no-unused-vars
const assert = require('assert')
// eslint-disable-next-line no-unused-vars
const chai = require('chai')
// eslint-disable-next-line no-unused-vars
const should = chai.should()
const nconf = require('nconf')
const Initializer = require('../../../rest/models/initializer')
const TestModule = require('../../../rest/models/IUser')
const testName = 'User'
const modelAPIMock = require('../../mock/ModelAPI-mock')

describe('Unit Tests for ' + testName, () => {
  let userId = ''
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
    testModule.retrieveUsers()
      .then(actual => {
        console.log(actual)
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
    testModule.createUser('testuser', '123456', 'bob@aol.com', 1, 1)
      .then(actual => {
        actual.should.have.property('username')
        actual.should.have.property('email')
        actual.should.have.property('companyId')
        actual.should.have.property('role')
        actual.should.have.property('id')
        userId = actual.id
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it(testName + ' Retrieve', (done) => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    testModule.retrieveUser(userId)
      .then(actual => {
        actual.should.have.property('username')
        actual.should.have.property('email')
        actual.should.have.property('companyId')
        actual.should.have.property('role')
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
      id: userId,
      username: 'testuser',
      email: 'bob@aol.com',
      companyId: 1,
      role: 2
    }
    testModule.updateUser(updated)
      .then(actual => {
        actual.should.have.property('username')
        actual.should.have.property('email')
        actual.should.have.property('companyId')
        actual.should.have.property('role')
        actual.should.have.property('id')
        actual.role.should.equal(updated.role)
        done()
      })
      .catch(err => {
        done(err)
      })
  })
})
