const { logger } = require('../../log')
const config = require('../../config')
const { prisma } = require('../../lib/prisma')
const crypto = require('../../lib/crypto.js')
const httpError = require('http-errors')
const { renameKeys } = require('../../lib/utils')
const R = require('ramda')
const Joi = require('@hapi/joi')
const { redisClient } = require('../../lib/redis')
const CacheFirstStrategy = require('../../lib/prisma-cache/src/cache-first-strategy')
const { adminPermissions, userPermissions } = require('./permissions')
const { createModel, load, listAll } = require('../Model')

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
  }`,
  id: `fragment UserId on User {
    id
  }`,
  userEmail: `fragment UserEmail on User {
    email
  }`
}

// ******************************************************************************
// Model Context
// ******************************************************************************
const modelContext = {
  DB: new CacheFirstStrategy({
    name: 'user',
    pluralName: 'users',
    fragments,
    defaultFragmentKey: 'basic',
    prisma,
    redis: redisClient,
    log: logger.info.bind(logger)
  })
}

// *********************************************************************
// Helpers
// *********************************************************************
const userCreateSchema = Joi.object().keys({
  email: Joi.string().email({ minDomainSegments: 2 }).required(),
  password: Joi.string().required(),
  role: Joi.string().required()
})

const renameQueryKeys = renameKeys({ search: 'username_contains' })

const dropInternalProps = R.omit(['passwordHash'])

// *********************************************************************
// Model API
// *********************************************************************
async function create (ctx, { data, ...opts }) {
  // Check payload against Joi schema
  let { error } = Joi.validate(data, userCreateSchema)
  if (error) throw httpError(400, error.message)
  data = this.validateAndHashPassword(data)
  let user = await ctx.DB.create({ ...opts, data, fragment = 'basic' })
  try {
    // send verification emails
  }
  catch (err) {
    // Log error, but resolve anyway.
    logger.error('Error starting email verification:', err)
  }
  return user
}

async function list (ctx, { where = {}, ...opts }) {
  return ctx.DB.list({ where: renameQueryKeys(where), ...opts, fragment = 'basic' })
}

async function update (ctx, { where, data, ...opts }) {
  if (!where) throw httpError(400, 'No record identifier "where"')

  let oldRec = await ctx.DB.load({ where })

  // To allow users to update their own info, users without "User:update"
  // permission can access this method.
  if (ctx.user) {
    let authorized = this.hasPermissions(ctx, { permissions: ['User:update'] })
    if (!authorized && oldRec.id === ctx.user.id) {
      // limit what fields a user can change
      const allowed = ['email', 'password']
      if (Object.keys(data).every(x => allowed.includes(x))) {
        authorized = true
      }
    }
    if (!authorized) throw new httpError.Forbidden()
  }

  if (data.password) {
    data = await this.validateAndHashPassword(data)
  }

  let user = await ctx.DB.update({ where, data, ...opts, fragment = 'basic' })

  if (data.email) {
    try {
      // send verification emails
    }
    catch (err) {
      logger.error('Error starting email verification:', err)
    }
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

async function validateAndHashPassword (ctx, data) {
  const pwdRe = new RegExp(config.password_regex)
  if (!pwdRe.test(data.password)) {
    throw httpError(400, config.password_validation_message)
  }
  return {
    ...R.omit(['password'], data),
    passwordHash: await crypto.hashPassword(data.password)
  }
}

async function authenticateUser (ctx, { username, password }) {
  if (!username || !password) throw new httpError.BadRequest()
  try {
    const user = await this.loadByUsername(username, 'internal')
    const matches = await crypto.verifyPassword(password, user.passwordHash)
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
const model = createModel(
  modelContext,
  {
    create,
    list,
    listAll,
    load,
    update,
    remove,
    validateAndHashPassword,
    authenticateUser,
    hasPermissions
  }
)

module.exports = {
  model,
  create,
  list,
  update,
  remove,
  validateAndHashPassword,
  authenticateUser,
  hasPermissions
}
