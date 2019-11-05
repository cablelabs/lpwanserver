const { publicApi } = require('./index')

const generator = async function * () {
  yield {}
}

describe('Device Model', () => {
  it('Update Device', async () => {
    let data = {
      name: 'updated name'
    }
    let ctx = {
      $m: {
        deviceNetworkTypeLink: { list: jest.fn(() => Promise.resolve([[]])) }
      },
      db: {
        update: jest.fn(async () => ({ ...data, id: 'a' }))
      }
    }
    await publicApi.update(ctx, { where: { id: 'a' }, data })
    expect(ctx.db.update.mock.calls[0][0].data).toEqual(data)
  })
  it('Remove Device', async () => {
    let ctx = {
      $m: {
        deviceNetworkTypeLink: { removeMany: jest.fn(generator) }
      },
      db: {
        remove: jest.fn()
      }
    }
    let id = 'a'
    const expectedRemoveManyArgs = { where: { device: { id } } }
    await publicApi.remove(ctx, { id })
    expect(ctx.$m.deviceNetworkTypeLink.removeMany.mock.calls[0][0]).toEqual(expectedRemoveManyArgs)
    expect(ctx.db.remove.mock.calls[0][0]).toBe(id)
  })

})
