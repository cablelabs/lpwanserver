const { sessions } = require('../../models')
const { pipe, authorize: auth } = require('../middleware/openapi-backend')

module.exports = {
  createSession: createSession,
  removeSession: pipe(
    auth(['Session:remove']),
    removeSession
  )
}

async function createSession (_, req, res) {
  return res.status(200).send(await sessions.authenticateUser(req.body))
}

async function removeSession (_, req, res) {
  await sessions.revokeToken(req.jwtPayload)
  return res.status(204).send()
}

module.exports = {
  createSession,
  removeSession
}
