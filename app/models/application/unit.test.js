const { publicApi } = require('./index')

const generator = async function * () {
  yield {}
}

describe('Application Model', () => {
  it('Update Application', async () => {
    let data = {
      name: 'A'
    }
    let ctx = {
      $m: {
        applicationNetworkTypeLink: { list: jest.fn(async () => [[]]) }
      },
      db: {
        load: jest.fn(() => Promise.resolve({ id: 'a', name: 'B' })),
        update: jest.fn(async () => ({ ...data, id: 'a' }))
      }
    }
    await publicApi.update(ctx, { where: { id: 'a' }, data })
    expect(ctx.db.update.mock.calls[0][0].data.name).toBe('A')
  })
  it('Remove Application', async () => {
    let ctx = {
      $m: {
        device: { removeMany: jest.fn(generator) },
        applicationNetworkTypeLink: { removeMany: jest.fn(generator) }
      },
      db: {
        remove: jest.fn()
      }
    }
    let id = 'a'
    const expectedRemoveManyArgs = { where: { application: { id } } }
    await publicApi.remove(ctx, { id })
    expect(ctx.$m.device.removeMany.mock.calls[0][0]).toEqual(expectedRemoveManyArgs)
    expect(ctx.$m.applicationNetworkTypeLink.removeMany.mock.calls[0][0]).toEqual(expectedRemoveManyArgs)
    expect(ctx.db.remove.mock.calls[0][0]).toBe(id)
  })
  // it(testName + ' Start', async () => {
  //   let testModule = new TestModule(modelAPIMock)
  //   should.exist(testModule)
  //   const actual = await testModule.startApplication(appId)
  //   console.log(actual)
  // })
  // it(testName + ' Test', async () => {
  //   let testModule = new TestModule(modelAPIMock)
  //   should.exist(testModule)
  //   const actual = await testModule.testApplication(appId, { name: 'test' })
  //   console.log(actual)
  // })
  // it.skip(testName + ' Pass Data to Application', async () => {
  //   let testModule = new TestModule(modelAPIMock)
  //   should.exist(testModule)
  //   const actual = await testModule.passDataToApplication(appId, 1, { name: 'test' })
  //   actual.should.be(204)
  // })
  // it(testName + ' Stop', async () => {
  //   let testModule = new TestModule(modelAPIMock)
  //   should.exist(testModule)
  //   const actual = await testModule.stopApplication(appId)
  //   console.log(actual)
  // })
})
