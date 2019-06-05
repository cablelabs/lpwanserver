// eslint-disable-next-line no-unused-vars
const assert = require('assert')
// eslint-disable-next-line no-unused-vars
const chai = require('chai')
// eslint-disable-next-line no-unused-vars
const should = chai.should()
const { prisma } = require('../../../prisma/generated/prisma-client')
const TestModule = require('../../../rest/models/IUser')
const modelAPIMock = require('../../mock/ModelAPI-mock')

const testName = 'User'

function assertUserProps (actual) {
  actual.should.have.property('username')
  actual.should.have.property('email')
  actual.should.have.property('role')
  actual.company.should.have.property('id')
  actual.should.have.property('id')
}

describe('Unit Tests for ' + testName, () => {
  let userId = ''
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
    const cos = await prisma.companies()
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const data = {
      username: 'testuser',
      password: '123456',
      email: 'bob@aol.com',
      companyId: cos[0].id,
      role: 'ADMIN'
    }
    const actual = await testModule.create(data)
    assertUserProps(actual)
    userId = actual.id
  })
  it(testName + ' Retrieve', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    const actual = await testModule.load(userId)
    assertUserProps(actual)
  })
  it(testName + ' Update', async () => {
    let testModule = new TestModule(modelAPIMock)
    should.exist(testModule)
    let updated = {
      id: userId,
      username: 'testuser',
      email: 'bob@aol.com',
      role: 'USER'
    }
    const actual = await testModule.update(updated)
    assertUserProps(actual)
    actual.role.should.equal(updated.role)
  })
})
