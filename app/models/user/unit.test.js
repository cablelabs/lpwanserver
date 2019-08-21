const { api } = require('./index')

let promiseIdentity = x => Promise.resolve(x)

function editUserContext () {
  return {
    $self: {
      validateAndHashPassword: jest.fn(() => Promise.resolve('xyz'))
    },
    $m: {
      emails: {
        isInUse: jest.fn(() => Promise.resolve(false)),
        verifyEmail: jest.fn(() => Promise.resolve())
      }
    }
  }
}

describe('User Model', () => {
  it('create valid user', async () => {
    let data = {
      password: '123456',
      email: 'fake@example.com',
      role: 'ADMIN'
    }
    let ctx = {
      ...editUserContext(),
      DB: {
        create: jest.fn(x => Promise.resolve(x.data))
      }
    }
    let user = await api.create(ctx, { data })
    expect(user.pwdHash).toBe('xyz')
    expect(user.email).toBe(data.email)
    expect(user.role).toBe(data.role)
    expect(ctx.$m.emails.isInUse.mock.calls.length).toBe(1)
    expect(ctx.$m.emails.verifyEmail.mock.calls.length).toBe(1)
  })

  it('list users', async () => {
    let ctx = { DB: { list: jest.fn(promiseIdentity) } }
    await api.list(ctx, { where: { search: 'fake' } })
    const args = ctx.DB.list.mock.calls[0][0]
    expect(args.where).toEqual({ 'email_contains': 'fake' })
    expect(args.fragment).toBe('basic')
  })

  it('update user', async () => {
    let data = {
      password: 'abcdef'
    }
    let ctx = {
      ...editUserContext(),
      DB: {
        load: jest.fn(() => Promise.resolve({ email: 'fake@example.com' })),
        update: jest.fn(x => Promise.resolve(x.data))
      }
    }
    const user = await api.update(ctx, { where: { id: 'a' }, data })
    expect(user.pwdHash).toBe('xyz')
  })
})
