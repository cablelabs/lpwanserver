const { users } = require('../../../models')
const { formatRelationshipsOut } = require('../../../lib/prisma')
const { pipe, authorize: auth } = require('../openapi-middleware')
const { update } = require('../crud')

function loadMyUser (_, req, res) {
  res.status(200).json(formatRelationshipsOut(req.user))
}

const verifyUserEmail = model => async (_, req, res) => {
  await model.handleEmailVerifyResponse(
    req.params.uuid,
    req.query.function,
    req.query.source
  )
  res.status(204).send()
}

module.exports = {
  loadMyUser,
  verifyUserEmail,
  handlers: {
    loadMyUser: pipe(
      auth(),
      loadMyUser
    ),
    updateUser: pipe(
      auth(),
      update(users)
    ),
    verifyUserEmail: verifyUserEmail(users)
  }
}
