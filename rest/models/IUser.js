const appLogger = require('../lib/appLogger.js')
const config = require('../config')
const { prisma, formatInputData } = require('../lib/prisma')
const crypto = require('../lib/crypto.js')
const uuidgen = require('uuid')
const httpError = require('http-errors')
const { onFail, renameKeys } = require('../lib/utils')
const R = require('ramda')
const Joi = require('@hapi/joi')
const { redisClient } = require('../lib/redis')
const CacheFirstStrategy = require('../../lib/prisma-cache/src/cache-first-strategy')

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
    role
    company {
      id
    }
  }`,
  basic: `fragment BasicUser on User {
    id
    username
    email
    role
    company {
      id
    }
  }`,
  profile: `fragment UserProfile on User {
    id
    username
    email
    emailVerified
    role
    company {
      id
      name
      type
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

// ******************************************************************************
// Database Client
// ******************************************************************************
const DB = new CacheFirstStrategy({
  name: 'user',
  pluralName: 'users',
  fragments,
  defaultFragmentKey: 'basic',
  prisma,
  redis: redisClient,
  log: appLogger.log.bind(appLogger)
})

// *********************************************************************
// Helpers
// *********************************************************************
const userCreateSchema = Joi.object().keys({
  username: Joi.string().required(),
  password: Joi.string().required(),
  companyId: Joi.string().required(),
  role: Joi.string(),
  email: Joi.string().email({ minDomainSegments: 2 }).when('role', { is: 'ADMIN', then: Joi.required(), otherwise: Joi.optional() })
})

const renameQueryKeys = renameKeys({ search: 'username_contains' })

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

// *********************************************************************
// Model
// *********************************************************************
module.exports = class User {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  async init () {
    // Expire records every 24 hours.
    // (24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
    setInterval(this.expireEmailVerify.bind(this), 24 * 60 * 60 * 1000)
    // Run expiration code at startup as well.
    this.expireEmailVerify()
  }

  load (id, fragment = 'basic') {
    return DB.load({ id }, { fragment })
  }

  loadByUsername (username, fragment = 'basic') {
    return DB.load({ username }, { fragment })
  }

  async list (query = {}, opts) {
    return DB.list(renameQueryKeys(query), opts)
  }

  async create (data) {
    // Check payload against Joi schema
    let { error } = Joi.validate(data, userCreateSchema)
    if (error) throw httpError(400, error.message)
    // Verify password passes company password policy
    await this.modelAPI.passwordPolicies.validatePassword(data.companyId, data.password)
    let user
    try {
      data.passwordHash = await crypto.hashPassword(data.password)
      delete data.password
      user = await DB.create(data, { fragment: 'profile' })
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

  async update ({ id, ...data }) {
    // MUST have at least an ID field in the passed update record.
    if (!id) throw httpError(400, 'No existing user ID')

    let originalUser = await this.load(id)

    if (data.password) {
      const companyId = data.companyId || data.company ? data.company.id : originalUser.company.id
      // Validate the password.
      await this.modelAPI.passwordPolicies.validatePassword(companyId, data.password)
      data.passwordHash = await crypto.hashPassword(data.password)
      delete data.password
    }

    if (data.role === 'ADMIN' && !(data.email || originalUser.email)) {
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

    let user = await DB.update({ id }, data, { fragment: 'internal' })

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

  remove (id) {
    return DB.remove({ id })
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
    const user = await this.load(ev.user.id)
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
