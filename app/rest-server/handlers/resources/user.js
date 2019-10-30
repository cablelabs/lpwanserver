const { user } = require('../../../models')
const { formatRelationshipsOut } = require('../../../lib/prisma')
const { pipe, authorize: auth } = require('../openapi-middleware')
const { update } = require('../crud')

function loadMyUser (_, req, res) {
  res.status(200).json(formatRelationshipsOut(req.user))
}

module.exports = {
  loadMyUser,
  handlers: {
    loadMyUser: pipe(
      auth(),
      loadMyUser
    ),
    updateUser: pipe(
      auth(),
      update(user)
    )
  }
}
