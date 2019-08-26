const jwt = require('jsonwebtoken')
const uuidv4 = require('uuid/v4')
const httpError = require('http-errors')

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function removeExpiredRevokedTokens (ctx) {
  const now = Date.now()
  ctx.revokedTokens = ctx.revokedTokens.filter(x => x.exp * 1000 < now)
}

async function tokenWasRevoked (ctx, payload) {
  return ctx.revokedTokens.some(x => x.jti === payload.jti)
}

async function authenticateUser (ctx, args) {
  const user = await ctx.$m.users.authenticateUser(args)
  return jwt.sign(
    { user: user.id, jti: uuidv4() },
    ctx.config.jwt_secret,
    {
      algorithm: ctx.config.jwt_algo,
      expiresIn: ctx.config.jwt_ttl,
      issuer: ctx.config.jwt_issuer
    }
  )
}

async function revokeToken (ctx, payload) {
  if (!payload.jti || typeof payload.jti !== 'string') {
    throw httpError(400, 'A JWT must have an ID (jti) to be revoked.')
  }
  if (!ctx.revokedTokens.some(x => x.jti === payload.jti)) {
    ctx.revokedTokens.push(payload)
  }
}

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = {
  context: {
    revokedTokens: []
  },
  api: {
    removeExpiredRevokedTokens,
    tokenWasRevoked,
    authenticateUser,
    revokeToken
  }
}
