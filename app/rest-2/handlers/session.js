const { sessions } = require('../../models')

async function createSession (ctx, req, res) {
  return res.status(200).send(await sessions.authenticateUser(req.body))
}

async function removeSession (ctx, req, res) {
  await sessions.revokeToken(req.jwtPayload)
  return res.status(204).send()
}

module.exports = {
  createSession,
  removeSession
}
