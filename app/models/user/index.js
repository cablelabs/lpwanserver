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
    username
    email
    pwdHash
  }`,
  basic: `fragment BasicUser on User {
    id
    role
    username
    email
  }`
}

// *********************************************************************
// Helpers
// *********************************************************************
const userCreateSchema = Joi.object().keys({
  role: Joi.string().required(),
  username: Joi.string().required(),
  email: Joi.string().email({ minDomainSegments: 2 }).when('role', { is: 'ADMIN', then: Joi.required(), otherwise: Joi.optional() }),
  password: Joi.string().required()
})

const renameQueryKeys = renameKeys({ search: 'username_contains' })
const dropInternalProps = R.omit(['pwdHash'])
const omitPwd = R.omit(['password'])

// *********************************************************************
// Model Functions
// *********************************************************************
async function create (ctx, { data }) {
  // Validate input
  let { error } = Joi.validate(data, userCreateSchema)
  if (error) throw httpError(400, error.message)
  // Async validation
  let pwdHash = await ctx.$self.validateAndHashPassword(data)
  // Create record
  return ctx.db.create({
    data: { ...omitPwd(data), pwdHash }
  })
}

async function list (ctx, { where = {}, ...opts }) {
  return ctx.db.list({ where: renameQueryKeys(where), ...opts, fragment: 'basic' })
}

async function update (ctx, { where, data }) {
  if (!where) throw httpError(400, 'No record identifier "where"')
  let oldRec = await ctx.db.load({ where })
  // ctx.user indicates
  if (ctx.user) {
    // To update own user, users without "User:update" permission can access this method.
    // If a user has the "User:update permission", allow all updates
    let authorized = ctx.$self.hasPermissions({ permissions: ['User:update'] }, ctx)
    // limit what fields a user can change on their own record
    if (!authorized && oldRec.id === ctx.user.id) {
      const allowed = ['email', 'password']
      authorized = Object.keys(data).every(x => allowed.includes(x))
    }
    if (!authorized) throw new httpError.Forbidden()
  }
  // Validate and hash password
  if (data.password) {
    data = { ...omitPwd(data), pwdHash: await ctx.$self.validateAndHashPassword(data) }
  }
  // Ensure admins have emails
  if (data.role === 'ADMIN' && !data.email && !oldRec.email) {
    throw httpError(400, 'Admin users must have an email address.')
  }
  // Update User record
  return ctx.db.update({ where, data })
}

function remove (ctx, id) {
  if (!id) throw httpError(400, 'Missing record identifier')
  if (ctx.user && ctx.user.id === id) {
    throw httpError(403, 'Cannot delete your own account')
  }
  return ctx.db.remove(id)
}

function validateAndHashPassword (ctx, { password }) {
  const pwdRe = new RegExp(ctx.config.password_regex)
  if (!pwdRe.test(password)) {
    throw httpError(400, ctx.config.password_validation_message)
  }
  return crypto.hashString(password)
}

async function authenticateUser (ctx, { username, password }) {
  if (!username || !password) throw new httpError.BadRequest()
  try {
    const user = await ctx.db.load({ where: { username }, fragment: 'internal' })
    const matches = await crypto.verifyString(password, user.pwdHash)
    if (!matches) throw new Error('Invalid password')
    return dropInternalProps(user)
  }
  catch (err) {
    // don't specify whether username or password failed
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
