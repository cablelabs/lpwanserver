const { api } = require('./index')

const generator = async function * () {
  yield {}
}

describe('Application Model', () => {
  it('Update Application', async () => {
    let data = {
      enabled: false
    }
    let ctx = {
      $self: {
        stop: jest.fn()
      },
      db: {
        load: jest.fn(() => Promise.resolve({ id: 'a', enabled: true })),
        update: jest.fn()
      }
    }
    await api.update(ctx, { where: { id: 'a' }, data })
    expect(ctx.db.update.mock.calls[0][0].data.enabled).toBe(false)
    expect(ctx.$self.stop.mock.calls[0][0]).toEqual('a')
  })
  it('Remove Application', async () => {
    let ctx = {
      $m: {
        devices: { removeMany: jest.fn(generator) },
        applicationNetworkTypeLinks: { removeMany: jest.fn(generator) }
      },
      db: {
        remove: jest.fn()
      }
    }
    let id = 'a'
    const expectedRemoveManyArgs = { where: { application: { id } } }
    await api.remove(ctx, id)
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
