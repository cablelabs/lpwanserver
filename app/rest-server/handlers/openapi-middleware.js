const httpError = require('http-errors')
const { user, session } = require('../../models')
const { log } = require('../../lib/log')
const R = require('ramda')

function pipeOpenApiBackendMiddleware (...fns) {
  return async (context, request, response) => {
    for (let i = 0; i < fns.length; i++) {
      await fns[i](context, request, response)
    }
  }
}

function authorize (permissions = []) {
  return async (ctx, req) => {
    // If the operation has declared a security scheme in the OpenAPI definition
    // but there is no user (no jwt was provided), reject request
    if (ctx.operation.security.length && !req.user) {
      log.debug('HTTP request failed due to no token in header.')
      throw new httpError.Unauthorized()
    }
    // Check that token hasn't been revoked
    if (await session.tokenWasRevoked(req.user)) {
      log.info('HTTP request failed due to revoked token', { jwt: req.user })
      throw new httpError.Unauthorized()
    }
    // Overwrite req.user with User record
    req.jwtPayload = req.user
    req.user = await user.load({ where: { id: req.user.user } })
    // Ensure user has required permissions for operation
    if (permissions.length && !user.hasPermissions({ permissions }, { user: req.user })) {
      log.info('HTTP request failed due to lack of permissions', {
        jwt: req.jwtPayload,
        requiredPermissions: permissions,
        userRole: req.user.role
      })
      throw new httpError.Forbidden()
    }
  }
}

function parseQueryInteger (key, req) {
  let val = parseInt(req.query[key], 10)
  if (isNaN(val)) {
    throw httpError(400, `${key} must be an integer`)
  }
}

function parseQueryIntegers (keys) {
  return (_, req) => {
    keys = keys.filter(x => (x in req.query))
    req.query = R.reduce((acc, x) => R.assoc(x, parseQueryInteger(x, req), acc), req.query)
  }
}

const parsePaginationQuery = parseQueryIntegers(['limit', 'offset'])

module.exports = {
  pipe: pipeOpenApiBackendMiddleware,
  authorize,
  parseQueryIntegers,
  parsePaginationQuery
}
