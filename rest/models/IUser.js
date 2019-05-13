const appLogger = require('../lib/appLogger.js')
const config = require('../config')
const { prisma, formatInputData, formatRelationshipsIn } = require('../lib/prisma')
const crypto = require('../lib/crypto.js')
const uuidgen = require('uuid')
const httpError = require('http-errors')
const { onFail } = require('../lib/utils')
const R = require('ramda')

module.exports = class User {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
    this.ROLE_ADMIN = 2
    this.ROLE_USER = 1
    this.roles = {}
    this.reverseRoles = {}
  }

  async init () {
    const roles = await prisma.userRoles()
    for (var i = 0; i < roles.length; ++i) {
      this.roles[ roles[ i ].name ] = roles[ i ].id
      this.reverseRoles[ roles[ i ].id ] = roles[ i ].name
    }
    // Expire records every 24 hours.
    // (24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
    setInterval(this.expireEmailVerify.bind(this), 24 * 60 * 60 * 1000)
    // Run expiration code at startup as well.
    this.expireEmailVerify()
  }

  // We run this "periodically" to delete old emailVerify records.  We user
  // the handler code above with a "reject" type and an "expired" source so
  // the handling and reporting code is in one place.
  async expireEmailVerify () {
    appLogger.log('Running expiration of email verify records')
    // 14 day limit on email changes.
    var timedOut = new Date()
    // Move now back 14 days.
    timedOut.setDate(timedOut.getDate() - 14)
    const where = { changeRequested_lt: timedOut.toISOString() }
    const records = await prisma.emailVerifications({ where })
    appLogger.log(records.length + ' email verify records to be expired')
    return Promise.all(
      records.map(x => this.handleEmailVerifyResponse(x.uuid, 'reject', 'expired verification request'))
    )
  }

  async create (username, password, email, companyId, roleId) {
    // Create the user record.
    const data = formatInputData({
      username,
      companyId,
      roleId,
      email
    })
    // Only allow admin if they pass in the correct admin value.
    // Otherwise, regular user.
    if (this.ROLE_ADMIN !== roleId) {
      data.role.connect.id = this.ROLE_USER
    }
    let user
    try {
      if (!email && this.ROLE_ADMIN === roleId) {
        throw new Error('Email MUST be provided for Admin account.')
      }
      // MUST have a password.  It MUST pass the rules for the company.
      // Returned hash is the salt and hash combined.
      if (!password) {
        throw new Error('Password MUST be provided.')
      }
      await this.modelAPI.passwordPolicies.validatePassword(companyId, password)
      data.passwordHash = await crypto.hashPassword(password)
      delete data.password
      user = await prisma.createUser(data).$fragment(fragments.profile)
    }
    catch (err) {
      throw httpError(400, err.message)
    }
    if (user.email) {
      try {
        await emailVerify(user.id, user.username, user.email, null, config.get('base_url'))
      }
      catch (err) {
        // Log error, but resolve anyway.
        appLogger.log('Error starting email verification:' + err)
      }
    }
    return dropInternalProps(user)
  }

  load (id, fragment = 'basic') {
    return loadUser({ id }, fragment)
  }

  loadByUsername (username, fragment = 'basic') {
    return loadUser({ username }, fragment)
  }

  async update ({ id, role, ...data }) {
    // MUST have at least an ID field in the passed update record.
    if (!id) throw httpError(400, 'No existing user ID')

    let originalUser = await this.load(id)
    data = formatInputData({ ...data, roleId: role })

    if (data.password) {
      const company = data.company || originalUser.company
      // Validate the password.
      await this.modelAPI.passwordPolicies.validatePassword(company.id, data.password)
      data.passwordHash = await crypto.hashPassword(data.password)
      delete data.password
    }

    if (role &&
        role === this.ROLE_ADMIN &&
        !(data.email || originalUser.email)) {
      throw httpError(400, 'Invalid change to ADMIN without an email')
    }

    function setEmailProps ({ email, ...data }) {
      if (email === originalUser.email) return data
      const result = { ...data, emailVerified: false }
      if (originalUser.emailVerified) {
        result.lastVerifiedEmail = originalUser.email
      }
      return result
    }

    if (data.email) data = setEmailProps(data)

    let user = await onFail(400, () => prisma.updateUser({ data, where: { id } }).$fragment(fragments.internal))

    if (data.email) {
      try {
        await emailVerify(
          user.id,
          user.username,
          user.email,
          user.lastVerifiedEmail,
          config.get('base_url')
        )
      }
      catch (err) {
        appLogger.log('Error starting email verification:' + err)
      }
    }

    return dropInternalProps(user)
  }

  async list ({ limit, offset, ...where } = {}) {
    where = formatRelationshipsIn(where)
    if (where.search) {
      where.username_contains = where.search
      delete where.search
    }
    const query = { where }
    if (limit) query.first = limit
    if (offset) query.skip = offset
    const [records, totalCount] = await Promise.all([
      prisma.users(query).$fragment(fragments.basic),
      prisma.usersConnection({ where }).aggregate().count()
    ])
    return { totalCount, records }
  }

  remove (id) {
    return onFail(400, () => prisma.deleteUser({ id }))
  }

  async authorizeUser (username, password) {
    try {
      const user = await this.loadByUsername(username, 'internal')
      const matches = await crypto.verifyPassword(password, user.passwordHash)
      if (!matches) throw new Error(`authorizeUser: passwords don't match username "${username}`)
      return dropInternalProps(user)
    }
    catch (err) {
      // don't specify whether or not username is valid
      throw new httpError.Unauthorized()
    }
  }

  async handleEmailVerifyResponse (uuid, type, source) {
    const ev = await retrieveEmailVerification(uuid)
    const user = await loadUser(ev.user)
    let userUpdate = { id: user.id }
    if (type === 'accept') {
      userUpdate.emailVerified = true
    }
    else {
      this.modelAPI.emails.notifyAdminsAboutReject(user, source)
      Object.assign(userUpdate, {
        email: user.lastVerifiedEmail,
        lastVerifiedEmail: '',
        emailVerified: true
      })
    }
    try {
      await this.update(userUpdate)
      await deleteEmailVerification(uuid)
    }
    catch (err) {
      appLogger.log('Update for EmailVerify failed. UUID = ' + uuid +
                                           ', type = ' + type +
                                           ', source = ' + source +
                                          ': ' + err)
      throw httpError.InternalServerError()
    }
  }

  async getCompanyAdmins (companyId) {
    const where = { company: { id: companyId } }
    const users = await prisma.users({ where }).$fragment(fragments.userEmail)
    return users.map(x => x.email).filter(R.identity)
  }
}

// *********************************************************************
// Helpers
// *********************************************************************
async function loadUser (uniqueKeyObj, fragementKey = 'internal') {
  const rec = await onFail(400, () => prisma.user(uniqueKeyObj).$fragment(fragments[fragementKey]))
  if (!rec) throw httpError(404, 'User not found')
  return rec
}

async function retrieveEmailVerification (uuid) {
  const ev = await onFail(400, () => prisma.emailVerification({ uuid }).$fragment(fragments.emailVerification))
  if (!ev) throw httpError(404, 'Email verification token not found')
  return ev
}

function deleteEmailVerification (uuid) {
  return onFail(400, () => prisma.deleteEmailVerification({ uuid }))
}


// Starts the process of verifying email.  We assume the email address has
// already been updated by the caller, with the old email saved and the new
// email set in the database, and emailVerified is set to false (otherwise we
// get into this whole big chicken-and-the-egg problem, trying to update the
// same record).  Sends email to old and new email addresses.  New can accept or
// reject the change, old can reject.  Emails include links to accept/reject.
//
// userId   - the id of the user to sent the email for
// username - the user's username (for emails)
// newemail - the new email address for this user
// oldemail - the previous email address for this user, if any
// urlRoot  - the root URL for verification/rejection links
//
// Returns a promise that handles the email verification.
async function emailVerify (userId, username, newemail, oldemail, urlRoot) {
  var data = formatInputData({
    // Need a UUID for the verification record.
    uuid: uuidgen.v4(),
    userId,
    email: newemail,
    // timestamp
    changeRequested: new Date().toISOString()
  })
  try {
    const record = await prisma.createEmailVerification(data)
    // Sending verification emails.
    this.modelAPI.emails.verifyEmail(oldemail,
      newemail,
      username,
      urlRoot,
      data.uuid)
    return record
  }
  catch (err) {
    appLogger.log('Failed to write emailVerification record: ' + err)
    throw err
  }
}

const dropInternalProps = R.omit(['passwordHash', 'emailVerified', 'lastVerifiedEmail'])

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  internal: `fragment InternalUser on User {
    id
    username
    email
    emailVerified
    lastVerifiedEmail
    passwordHash
    company {
      id
    }
    role {
      id
    }
  }`,
  basic: `fragment BasicUser on User {
    id
    username
    email
    company {
      id
    }
    role {
      id
    }
  }`,
  profile: `fragment UserProfile on User {
    id
    username
    email
    emailVerified
    company {
      id
      name
      type {
        id
      }
    }
    role {
      id
    }
  }`,
  userEmail: `fragment UserEmail on User {
    email
  }`,
  emailVerification: `fragment BasicEmailVerification on EmailVerification {
    id
    uuid
    email
    changeRequested
    user {
      id
    }
  }`
}
