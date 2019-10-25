const { publicApi } = require('./index')

let promiseIdentity = x => Promise.resolve(x)

function editUserContext () {
  return {
    $self: {
      validateAndHashPassword: jest.fn(() => Promise.resolve('xyz'))
    }
  }
}

describe('User Model', () => {
  it('create valid user', async () => {
    let data = {
      username: 'schmitty',
      password: '123456',
      email: 'fake@example.com',
      role: 'ADMIN'
    }
    let ctx = {
      ...editUserContext(),
      db: {
        create: jest.fn(x => Promise.resolve(x.data))
      }
    }
    let user = await publicApi.create(ctx, { data })
    expect(user.pwdHash).toBe('xyz')
    expect(user.email).toBe(data.email)
    expect(user.role).toBe(data.role)
  })

  it('list users', async () => {
    let ctx = { db: { list: jest.fn(promiseIdentity) } }
    await publicApi.list(ctx, { where: { search: 'fake' } })
    const args = ctx.db.list.mock.calls[0][0]
    expect(args.where).toEqual({ 'username_contains': 'fake' })
    expect(args.fragment).toBe('basic')
  })

  it('update user', async () => {
    let data = {
      password: 'abcdef'
    }
    let ctx = {
      ...editUserContext(),
      db: {
        load: jest.fn(() => Promise.resolve({ email: 'fake@example.com' })),
        update: jest.fn(x => Promise.resolve(x.data))
      }
    }
    const user = await publicApi.update(ctx, { where: { id: 'a' }, data })
    expect(user.pwdHash).toBe('xyz')
  })
})
