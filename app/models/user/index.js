const crypto = require('../../lib/crypto.js')
const httpError = require('http-errors')
const { renameKeys } = require('../../lib/utils')
const R = require('ramda')
const Joi = require('@hapi/joi')
const { adminPermissions, userPermissions } = require('./permissions')
const { load, listAll } = require('../model-lib')

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  internal: `fragment InternalUser on User {
    id
    role
    email
    passwordHash
  }`,
  basic: `fragment BasicUser on User {
    id
    role
    email
  }`
}

// *********************************************************************
// Helpers
// *********************************************************************
const userCreateSchema = Joi.object().keys({
  email: Joi.string().email({ minDomainSegments: 2 }).required(),
  password: Joi.string().required(),
  role: Joi.string().required()
})

const renameQueryKeys = renameKeys({ search: 'email_contains' })
const dropInternalProps = R.omit(['passwordHash'])
const omitPwd = R.omit(['password'])

// *********************************************************************
// Model Functions
// *********************************************************************
async function create (ctx, { data }) {
  // Validate input
  let { error } = Joi.validate(data, userCreateSchema)
  if (error) throw httpError(400, error.message)
  // Async validation
  let [pwdHash, emailInUse] = await Promise.all([
    ctx.$self.validateAndHashPassword(data),
    ctx.$m.emails.isInUse({ address: data.email })
  ])
  if (emailInUse) {
    throw httpError(400, 'Email is already in use.')
  }
  // Create record
  let user = await ctx.DB.create({
    data: { ...omitPwd(data), pwdHash }
  })
  // Send verification email
  await ctx.$m.emails.verifyEmail({ user }).catch(err => {
    ctx.log.error('Error starting email verification:', err)
  })
  return user
}

async function list (ctx, { where = {}, ...opts }) {
  return ctx.DB.list({ where: renameQueryKeys(where), ...opts, fragment: 'basic' })
}

async function update (ctx, { where, data }) {
  if (!where) throw httpError(400, 'No record identifier "where"')
  let oldRec = await ctx.DB.load({ where })
  // ctx.user indicates
  if (ctx.user) {
    // To update own user, users without "User:update" permission can access this method.
    // If a user has the "User:update permission", allow all updates
    let authorized = ctx.$self.hasPermissions({ permissions: ['User:update'] })
    // limit what fields a user can change on their own record
    if (!authorized && oldRec.id === ctx.user.id) {
      const allowed = ['email', 'password']
      authorized = Object.keys(data).every(x => allowed.includes(x))
    }
    if (!authorized) throw new httpError.Forbidden()
    if (data.email && await ctx.$m.emails.isInUse({ address: data.email })) {
      throw httpError(400, 'Email is already in use.')
    }
  }
  // Validate and hash password
  if (data.password) {
    data = { ...omitPwd(data), pwdHash: await ctx.$self.validateAndHashPassword(data) }
  }
  // Update User record
  let user = await ctx.DB.update({ where, data })
  // Verify new email
  // Check for ctx.user ensures this is not run when the Email model updates a user's email
  if (ctx.user && data.email) {
    await ctx.$m.emails.verifyEmail({ user, oldAddress: oldRec.email }).catch(err => {
      ctx.log.error('Error starting email verification:', err)
    })
  }
  return user
}

function remove (ctx, id) {
  if (!id) throw httpError(400, 'Missing record identifier')
  if (ctx.user && ctx.user.id === id) {
    throw httpError(403, 'Cannot delete your own account')
  }
  return ctx.DB.remove(id)
}

function validateAndHashPassword (ctx, { password }) {
  const pwdRe = new RegExp(ctx.config.password_regex)
  if (!pwdRe.test(password)) {
    throw httpError(400, ctx.config.password_validation_message)
  }
  return crypto.hashString(password)
}

async function authenticateUser (ctx, { email, password }) {
  // TODO: require email address have a verified status, or maybe put in config?
  if (!email || !password) throw new httpError.BadRequest()
  try {
    const user = await ctx.DB.load({ where: { email }, fragment: 'internal' })
    const matches = await crypto.verifyString(password, user.passwordHash)
    if (!matches) throw new Error('Invalid password')
    return dropInternalProps(user)
  }
  catch (err) {
    // don't specify whether or not username is valid
    throw new httpError.Unauthorized()
  }
}

function hasPermissions (ctx, { permissions }) {
  const has = ctx.user.role === 'ADMIN' ? adminPermissions : userPermissions
  return permissions.every(x => has.includes(x))
}

// *********************************************************************
// Model
// *********************************************************************
module.exports = {
  api: {
    create,
    list,
    listAll,
    load,
    update,
    remove,
    validateAndHashPassword,
    authenticateUser,
    hasPermissions
  },
  fragments
}
