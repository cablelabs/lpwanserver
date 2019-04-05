// Logging
var appLogger = require('../../../lib/appLogger.js')

// Config access.
const config = require('../../../config')

// Database implementation.
const { prisma, formatInputData, formatRelationshipsIn } = require('../../../lib/prisma')

// Password hashing
var crypto = require('../../../lib/crypto.js')

// Email support
var emails = require('./emails.js')

// UUID generation
var uuidgen = require('uuid')

// Company support.
var companies = require('./companies.js')

// Error reporting
var httpError = require('http-errors')

// Utils
const { onFail } = require('../../../lib/utils')
const R = require('ramda')

const ROLE_USER = 1
const ROLE_ADMIN = 2

const dropInternalProps = R.omit(['passwordHash', 'emailVerified', 'lastVerifiedEmail'])

//* *****************************************************************************
// Users database table.
//* *****************************************************************************

module.exports = {
  ROLE_ADMIN,
  ROLE_USER,
  createUser,
  retrieveUser,
  retrieveUserByUsername,
  updateUser,
  deleteUser,
  retrieveUsers,
  authorizeUser,
  retrieveUserProfile,
  getCompanyAdmins,
  getRoles,
  emailVerifyInit,
  emailVerify,
  handleEmailVerifyResponse
}

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the user record.
//
// username  - the username to be used to log in.
// password  - the password to be used to log in.
// email     - the user's email.  MUST be provided if admin.
// companyId - the record ID that this user is to be part of.
// role      - the user's role in the system. ROLE_ADMIN can manage users,
//             password policies.  ROLE_USER for all others.
//
// Returns the promise that will execute the create.
async function createUser (username, password, email, companyId, roleId) {
  // Create the user record.
  const data = formatInputData({
    username,
    companyId,
    roleId,
    email
  })
  // Only allow admin if they pass in the correct admin value.
  // Otherwise, regular user.
  if (ROLE_ADMIN !== roleId) {
    data.role.connect.id = ROLE_USER
  }
  let user
  try {
    if (!email && ROLE_ADMIN === roleId) {
      throw new Error('Email MUST be provided for Admin account.')
    }
    // MUST have a password.  It MUST pass the rules for the company.
    // Returned hash is the salt and hash combined.
    if (!password) {
      throw new Error('Password MUST be provided.')
    }
    await companies.passwordValidator(companyId, password)
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

async function loadUser (uniqueKeyObj, fragementKey = 'internal') {
  const rec = await onFail(400, () => prisma.user(uniqueKeyObj).$fragment(fragments[fragementKey]))
  if (!rec) throw httpError(404, 'User not found')
  return rec
}

// Retrieve a user record by id.
//
// id - the record id of the user.
//
// Returns a promise that executes the retrieval.
function retrieveUser (id, fragment = 'basic') {
  return loadUser({ id }, fragment)
}

// Retrieve a user record by username.
//
// username - the username of the user.
//
// Returns a promise that executes the retrieval.
async function retrieveUserByUsername (username, fragment = 'basic') {
  return loadUser({ username }, fragment)
}

// Update the user record.
//
// user - the updated user record.  Note that the id must be unchanged from
//        retrieval to guarantee the same record is updated.
//
// Returns a promise

async function updateUser ({ id, role, ...data }) {
  // MUST have at least an ID field in the passed update record.
  if (!id) throw httpError(400, 'No existing user ID')

  let originalUser = await retrieveUser(id)
  data = formatInputData({ ...data, roleId: role })

  if (data.password) {
    const company = data.company || originalUser.company
    // Validate the password.
    await companies.passwordValidator(company.id, data.password)
    data.passwordHash = await crypto.hashPassword(data.password)
    delete data.password
  }

  if (role &&
      role === ROLE_ADMIN &&
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

// Delete the user record.
//
// userId - the id of the user record to delete.
//
// Returns a promise.
function deleteUser (id) {
  return onFail(400, () => prisma.deleteUser({ id }))
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

/**
 * Retrieves a subset of the users in the system given the options.
 *
 * Options include limits on the number of users returned, the offset to
 * the first user returned (together giving a paging capability), a search
 * string on username, and/or the company associated with the user.
 *
 */
async function retrieveUsers ({ limit, offset, ...where } = {}) {
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

//* *****************************************************************************
// Other functions.
//* *****************************************************************************

// Authorize user.  Verify a username and password are valid.
//
// username - the data entered as the username
// password - the data entered as a password for the user.
//
// Returns a promise that executes the authorization.
async function authorizeUser (username, password) {
  try {
    const user = await retrieveUserByUsername(username, 'internal')
    const matches = await crypto.verifyPassword(password, user.passwordHash)
    if (!matches) throw new Error(`authorizeUser: passwords don't match username "${username}`)
    return dropInternalProps(user)
  }
  catch (err) {
    // don't specify whether or not username is valid
    throw new httpError.Unauthorized()
  }
}

// Retrieves the "user profile" which is the user data and the company data in
// a single object.
//
// username - the username to retrieve the profile data for.
//
// Returns a promise that will retrieve the user profile.
function retrieveUserProfile (username) {
  return loadUser({ username }, 'profile')
}

// Returns the emails of the admin users for the company as a comma-separated
// list.  This method is intended to get the admins for a user, by using the
// companyId in the user's record.
//
// companyId - the id of the company that the user is part of.
//
// Returns a promise that gets the emails.
async function getCompanyAdmins (companyId) {
  const where = { company: { id: companyId } }
  const users = await prisma.users({ where }).$fragment(fragments.userEmail)
  return users.map(x => x.email).filter(R.identity)
}

// Gets the user roles from the database table
function getRoles () {
  return prisma.userRoles()
}
//* *****************************************************************************
// Email verification.
//* *****************************************************************************

// Initialize the side processes that manage email verification records.  For
// example, the process that expires old records.
function emailVerifyInit () {
  // Expire records every 24 hours.
  // (24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
  setInterval(expireEmailVerify, 24 * 60 * 60 * 1000)

  // Oh, and might as well run expiration code at startup as well.
  expireEmailVerify()
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
    emails.verifyEmail(oldemail,
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

// Returns the email verify record based on the uuid.
//
// uuid - the UUID that IDs the record.
//
// Returns a promise.
async function retrieveEmailVerification (uuid) {
  const ev = await onFail(400, () => prisma.emailVerification({ uuid }).$fragment(fragments.emailVerification))
  if (!ev) throw httpError(404, 'Email verification token not found')
  return ev
}

// Deletes the email verify record based on the uuid.
//
// uuid - the UUID that IDs the record.
//
// Returns a promise.
function deleteEmailVerification (uuid) {
  return onFail(400, () => prisma.deleteEmailVerification({ uuid }))
}

// Verifies the email with the given UUID.
async function handleEmailVerifyResponse (uuid, type, source) {
  const ev = await retrieveEmailVerification(uuid)
  const user = await loadUser(ev.user)
  let userUpdate = { id: user.id }
  if (type === 'accept') {
    userUpdate.emailVerified = true
  }
  else {
    emails.notifyAdminsAboutReject(user, source)
    Object.assign(userUpdate, {
      email: user.lastVerifiedEmail,
      lastVerifiedEmail: '',
      emailVerified: true
    })
  }
  try {
    await updateUser(userUpdate)
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

// We run this "periodically" to delete old emailVerify records.  We user
// the handler code above with a "reject" type and an "expired" source so
// the handling and reporting code is in one place.
async function expireEmailVerify () {
  appLogger.log('Running expiration of email verify records')
  // 14 day limit on email changes.
  var timedOut = new Date()
  // Move now back 14 days.
  timedOut.setDate(timedOut.getDate() - 14)
  const where = { changeRequested_lt: timedOut.toISOString() }
  const records = await prisma.emailVerifications({ where })
  appLogger.log(records.length + ' email verify records to be expired')
  return Promise.all(
    records.map(x => handleEmailVerifyResponse(x.uuid, 'reject', 'expired verification request'))
  )
}

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
