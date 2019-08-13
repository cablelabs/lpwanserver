const { default: OpenApiBackend } = require('openapi-backend')
// const config = require('../config')
const definition = require('./api-definition')
const { pipe, authorize: auth, companyScope, parseQueryIntegers } = require('./middleware')
const Session = require('./handlers/session')
const User = require('./handlers/user')
const Company = require('./handlers/company')
const ApplicationNtl = require('./handlers/application-ntl')

const parsePaginationQuery = parseQueryIntegers(['limit', 'offset'])

function validationFailHandler (c, req, res) {
  return res.status(400).json({ status: 400, err: c.validation.errors })
}

const handlers = {
  validationFail: validationFailHandler,

  // ApplicationNetworkTypeLink
  createApplicationNetworkTypeLink: pipe(
    auth(['ApplicationNetworkTypeLink:create']),
    ApplicationNtl.createApplicationNetworkTypeLink
  ),
  listApplicationNetworkTypeLinks: pipe(
    auth(['ApplicationNetworkTypeLink:list']),
    companyScope(['query', 'companyId'], true),
    ApplicationNtl.listApplicationNetworkTypeLinks
  ),
  loadApplicationNetworkTypeLink: pipe(
    auth(['ApplicationNetworkTypeLink:load']),
    ApplicationNtl.loadApplicationNetworkTypeLink
  ),
  updateApplicationNetworkTypeLink: pipe(
    auth(['ApplicationNetworkTypeLink:update']),
    ApplicationNtl.updateApplicationNetworkTypeLink
  ),
  removeApplicationNetworkTypeLink: pipe(
    auth(['ApplicationNetworkTypeLink:remove']),
    ApplicationNtl.removeApplicationNetworkTypeLink
  ),
  pushApplicationNetworkTypeLink: pipe(
    auth(['ApplicationNetworkTypeLink:push']),
    ApplicationNtl.pushApplicationNetworkTypeLink
  ),

  // Company
  createCompany: pipe(
    auth(['Company:create']),
    Company.createCompany
  ),
  listCompanies: pipe(
    auth(['Company:list']),
    parsePaginationQuery,
    Company.listCompanies
  ),
  loadCompany: pipe(
    auth(['Company:load']),
    Company.loadCompany
  ),
  updateCompany: pipe(
    auth(['Company:update']),
    Company.updateCompany
  ),
  removeCompany: pipe(
    auth(['Company:remove']),
    Company.removeCompany
  ),

  // Session
  createSession: Session.createSession,
  removeSession: pipe(
    auth(['Session:remove']),
    Session.removeSession
  ),

  // User
  createUser: pipe(
    auth(['User:create']),
    companyScope(['body', 'companyId'], false),
    User.createUser
  ),
  listUsers: pipe(
    auth(['User:list']),
    companyScope(['query', 'companyId'], true),
    parsePaginationQuery,
    User.listUsers
  ),
  loadUser: pipe(
    auth(['User:load']),
    User.loadUser
  ),
  updateUser: pipe(
    auth(['User:update']),
    User.updateUser
  ),
  removeUser: pipe(
    auth(['User:remove']),
    User.removeUser
  ),
  loadMyUser: pipe(
    auth(),
    User.loadMyUser
  ),
  verifyUserEmail: User.verifyUserEmail
}

module.exports = new OpenApiBackend({ definition, handlers })
