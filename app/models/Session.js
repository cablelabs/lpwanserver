const config = require('../config')
const jwt = require('jsonwebtoken')
// const { logger } = require('../log')
const uuidv4 = require('uuid/v4')
const httpError = require('http-errors')

module.exports = class SessionManager {
  constructor (UserModel) {
    this.UserModel = UserModel
    // array of token payloads that have been revoked
    this.revokedTokens = []
    this.removeExpiredRevokedTokens = this.removeExpiredRevokedTokens.bind(this)
    setInterval(this.removeExpiredRevokedTokens, 60000)
  }

  removeExpiredRevokedTokens () {
    const now = Date.now()
    this.revokedTokens = this.revokedTokens.filter(x => x.exp * 1000 < now)
  }

  async tokenWasRevoked (payload) {
    return this.revokedTokens.some(x => x.jti === payload.jti)
  }

  async authenticateUser ({ login_username: uname, login_password: pwd }) {
    const user = await this.UserModel.authenticateUser(uname, pwd)
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

  revokeToken (payload) {
    if (!payload.jti || typeof payload.jti !== 'string') {
      throw httpError(400, 'A JWT must have an ID (jti) to be revoked.')
    }
    if (!this.revokedTokens.some(x => x.jti === payload.jti)) {
      this.revokedTokens.push(payload)
    }
  }
}
