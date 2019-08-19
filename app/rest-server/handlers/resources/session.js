const { sessions } = require('../../../models')
const { pipe, authorize: auth } = require('../openapi-middleware')

const createSession = model => async (_, req, res) => {
  return res.status(200).send(await model.authenticateUser(req.body))
}

const removeSession = model => async (_, req, res) => {
  await model.revokeToken(req.jwtPayload)
  return res.status(204).send()
}

module.exports = {
  createSession,
  removeSession,
  handlers: {
    createSession: createSession(sessions),
    removeSession: pipe(
      auth(['Session:remove']),
      removeSession(sessions)
    )
  }
}
