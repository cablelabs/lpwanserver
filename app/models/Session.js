const config = require('../config')
const jwt = require('jsonwebtoken')
// const { logger } = require('../log')
const uuidv4 = require('uuid/v4')
const httpError = require('http-errors')
const { createModel } = require('./Model')

// ******************************************************************************
// Model Context
// ******************************************************************************
const modelContext = {
  state: {
    removedTokens: []
  }
}

// ******************************************************************************
// Model API
// ******************************************************************************
async function removeExpiredRevokedTokens (ctx) {
  const now = Date.now()
  ctx.state.revokedTokens = ctx.state.revokedTokens.filter(x => x.exp * 1000 < now)
}

async function tokenWasRevoked (ctx, payload) {
  return ctx.state.revokedTokens.some(x => x.jti === payload.jti)
}

async function authenticateUser (ctx, { username, password }) {
  const user = await ctx.$models.users.authenticateUser(username, password)
  return jwt.sign(
    { user: user.id, jti: uuidv4() },
    config.jwt_secret,
    {
      algorithm: config.jwt_algo,
      expiresIn: config.jwt_ttl,
      issuer: config.jwt_issuer
    }
  )
}

async function revokeToken (ctx, payload) {
  if (!payload.jti || typeof payload.jti !== 'string') {
    throw httpError(400, 'A JWT must have an ID (jti) to be revoked.')
  }
  if (!ctx.state.revokedTokens.some(x => x.jti === payload.jti)) {
    this.revokedTokens.push(payload)
  }
}

// ******************************************************************************
// Model
// ******************************************************************************
const model = createModel(
  modelContext,
  {
    removeExpiredRevokedTokens,
    tokenWasRevoked,
    authenticateUser,
    revokeToken
  }
)

setInterval(model.removeExpiredRevokedTokens, 60000)

module.exports = {
  model,
  tokenWasRevoked,
  authenticateUser,
  revokeToken
}
