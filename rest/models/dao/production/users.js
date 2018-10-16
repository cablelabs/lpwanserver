// Logging
var appLogger = require('../../../lib/appLogger.js')

// Config access.
var nconf = require('nconf')

// Database implementation.
var db = require('../../../lib/dbsqlite.js')

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

exports.ROLE_USER = 1
exports.ROLE_ADMIN = 2

//* *****************************************************************************
// Users database table.
//* *****************************************************************************

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
exports.createUser = function (username, password, email, companyId, role) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    var user = {}
    user.username = username
    user.companyId = companyId
    user.role = role

    // Savethe email.
    if (email && email != '') {
      user.email = email
      user.emailVerified = false
    }
    else if (exports.ROLE_ADMIN == role) {
      // Issue - admin account MUST have an email.
      reject(httpError(400, 'Email MUST be provided for Admin account.'))
      return
    }

    // Only allow admin if they pass in the correct admin value.
    // Otherwise, regular user.
    if (exports.ROLE_ADMIN != user.role) {
      user.role = exports.ROLE_USER
    }

    // MUST have a password.  It MUST pass the rules for the company.
    // Returned hash is the salt and hash combined.
    if (!password) {
      reject(httpError(400, 'Password MUST be provided.'))
      return
    }

    // Validate the password.
    companies.passwordValidator(companyId, password).then(function () {
      crypto.hashPassword(password, function (err, hash) {
        if (!err) {
          // Need a string to store in DB. Convert back to buffer on fetch.
          user.passwordHash = hash.toString('hex')

          // We need to do the insert here because of the callback
          db.insertRecord('users', user, function (err, record) {
            if (err) {
              reject(httpError(400, err))
            }
            else {
              if (record.email && (record.email != '')) {
                // Verify that email
                exports.emailVerify(record.id,
                  record.username,
                  record.email,
                  null,
                  nconf.get('base_url'))
                  .then(function () {
                    resolve(record)
                  })
                  .catch(function () {
                    // Log error, but resolve anyway.
                    appLogger.log('Error starting email verification:' + err)
                    resolve(record)
                  })
              } // Verify new email.
              else {
                resolve(record)
              }
            }
          }) // End of insert record callback.
        } // End of password hash successful.
        else {
          reject(httpError(400, err))
        } // End of password hash failed.
      }) // End of password hash callback.
    }, // End of password validator callback
    function (err) {
      reject(err)
    })
  }) // End of promise.
}

// Retrieve a user record by id.
//
// id - the record id of the user.
//
// Returns a promise that executes the retrieval.
exports.retrieveUser = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('users', 'id', id, function (err, rec) {
      if (err) {
        reject(err)
      }
      else if (!rec) {
        reject(new httpError.NotFound())
      }
      else {
        resolve(rec)
      }
    })
  })
}

// Update the user record.
//
// user - the updated user record.  Note that the id must be unchanged from
//        retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
var updatedUser
var originalUser

exports.updateUser = function (user) {
  return new Promise(function (resolve, reject) {
    // MUST have at least an ID field in the passed update record.
    if (!user.id) {
      reject(httpError(400, 'No existing user ID'))
      return
    }
    // There are a couple of conditional aspects of a user update that need
    // to be addressed.  If a password is updated, it must be validated and
    // converted to a hashed value.  If an email is updated, we must load
    // the user record to see if the previous email was verified, and if so,
    // we save it in case the new email verification is rejected.  (We also
    // save a verification record and send emails to allow user verification
    // of the new email.)  Failure of either causes the request to be
    // considered "bad".
    //
    // In order to handle these in a "standard way" we are going to
    // generate promises for each of the possibilities and run them at the
    // appropriate times.  If we don't need a particular step, we'll use an
    // "empty promise" in it's place that simply immediately resolves.
    //
    // Note the "trick" here.  We create promise factories rather than
    // actual promises (a factory is a function that returns a new promise).
    // Promises actually run at creation time, so if we assigned a variable
    // to new Promise() we would be running that promise immediately.  Since
    // some of our later promises depend on previous ones, this would cause
    // errors (I know this because this is how I initially wrote the code).
    // The functions cause the promises to be created when the then() is
    // called, and therefore run at THAT time.

    // Set up the optional promise variables.  *Pre run before the
    // user update, *Post run after.  We may need the old user record
    // loaded, and if we do, we'll set originalUserNeeded and handle
    // below.
    var oldUserPre
    var noEmailPre
    var emailPre
    var emailPost
    var passwordPre

    // Post-update may need access to the updated record.  Save it here.
    var originalUserNeeded = false
    if (user.email && (user.email != '')) {
      originalUserNeeded = true
      // Set up the user record to properly handle the new email.
      emailPre = function () {
        return new Promise(function (resolve, reject) {
          // Skip a non-change.
          if (user.email === originalUser.email) {
            delete user.email
            resolve()
          }
          else {
            // Save the last email if it was verified.
            if (originalUser.emailVerified) {
              user.lastVerifiedEmail = originalUser.email
            }

            // New email is not yet verified.
            user.emailVerified = false

            resolve()
          }
        }) // End of emailPre promise
      } // End of emailPre definition.

      // Set up for email verify after the update.
      emailPost = function () {
        return new Promise(function (resolve, reject) {
          // Verify that email, if there was one.
          if (!updatedUser || !updatedUser.email) {
            resolve()
            return
          }
          exports.emailVerify(updatedUser.id,
            updatedUser.username,
            updatedUser.email,
            updatedUser.lastVerifiedEmail,
            nconf.get('base_url')).then(function () {
            resolve()
          })
            .catch(function (err) {
              appLogger.log('Error starting email verification:' + err)
              resolve()
            })
        })
      } // End of emailPost function.

      noEmailPre = function () {
        return Promise.resolve()
      }
    } // End of setting up email promises.
    else {
      // No email, so just use pre-resolved empty promises.
      emailPre = function () {
        return Promise.resolve()
      }
      emailPost = function () {
        return Promise.resolve()
      }

      // But in the no-email case, we need to verify that they are not
      // changing to admin.  If they are, we need to make sure they
      // already have an email.
      if (user.role && user.role == exports.ROLE_ADMIN) {
        originalUserNeeded = true
        noEmailPre = function () {
          return new Promise(function (resolve, reject) {
            // Existance of this promise says we have no new email, but
            // the role is being changed to ADMIN.  The old user record
            // MUST have an email, then.
            if (!originalUser.email) {
              reject(httpError(400, 'Invalid change to ADMIN without an email'))
            }
            else {
              resolve()
            }
          })
        }
      }
      else {
        // Not changing to AUTH without an email.
        noEmailPre = function () {
          return Promise.resolve()
        }
      }
    }

    // Now add the setup for password changes.
    if (user.password) {
      // We only need the original user if the user update does not
      // include a new companyId or a new role.
      if (!user.companyId || !user.role) {
        originalUserNeeded = true
      }

      // Define the password setup.
      passwordPre = function () {
        return new Promise(function (resolve, reject) {
          //
          // Get the companyId.
          var companyId
          if (user.companyId) {
            companyId = user.companyId
          }
          else {
            companyId = originalUser.companyId
          }
          // Validate the password.
          companies.passwordValidator(companyId, user.password).then(function () {
            crypto.hashPassword(user.password, function (err, hash) {
              if (!err) {
                // Replace the password with the hash.
                delete user.password
                // Convert the hash Buffer to a byte array.
                user.passwordHash = hash.toString('hex')
                resolve()
              }
              else {
                reject(400, err)
              }
            })
          })
            .catch(function (err) {
              reject(400, err)
            })
        }) // End of password handling promise.
      }
    }
    else {
      passwordPre = function () {
        return Promise.resolve()
      }
    }

    if (originalUserNeeded) {
      oldUserPre = function () {
        return new Promise(function (resolve, reject) {
          exports.retrieveUser(user.id).then(function (rec) {
            originalUser = rec
            resolve()
          })
            .catch(function (err) {
              appLogger.log('Retrieve original user error: ' + err)
              reject(httpError(400, err))
            })
        })
      }
    }
    else {
      oldUserPre = function () {
        return Promise.resolve()
      }
    }

    // All set up, run it.
    oldUserPre() // Load old user if needed.
      .then(emailPre) // Validate email if provided.
      .then(noEmailPre) // Validate change to AUTH without email.
      .then(passwordPre) // Validate password.
      .then(function () { // Update record.
        db.updateRecord('users', 'id', user, function (err) {
          if (err) {
            appLogger.log('Rejecting update')
            reject(err)
          }
          else {
            // Get the updated record.
            db.fetchRecord('users', 'id', user.id, function (err, rec2) {
              if (err) {
                appLogger.log("Rejecting update's fetch: " + err)
                reject(err)
              }
              else {
                updatedUser = rec2
                resolve(rec2)
              }
            })
          }
        })
      })
      .then(emailPost) // Post user update email verification steps.
      .catch(function (err) {
        appLogger.log('Caught update error: ' + err)
        reject(500, err)
      })
  }) // End returned promise.
}

// Delete the user record.
//
// userId - the id of the user record to delete.
//
// Returns a promise that performs the delete.
exports.deleteUser = function (userId) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('users', 'id', userId, function (err, rec) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rec)
      }
    })
  })
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Retrieve a user record by username.
//
// username - the username of the user.
//
// Returns a promise that executes the retrieval.
exports.retrieveUserByUsername = function (username) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('users', 'username', username, function (err, rec) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rec)
      }
    })
  })
}

/**
 * Retrieves a subset of the users in the system given the options.
 *
 * Options include limits on the number of users returned, the offset to
 * the first user returned (together giving a paging capability), a search
 * string on username, and/or the company associated with the user.
 *
 */
exports.retrieveUsers = function (options) {
  return new Promise(function (resolve, reject) {
    var sql = 'select id, username, email, emailVerified, role, companyId from users'
    var sqlTotalCount = 'select count( id ) as count from users'
    if (options) {
      if (options.companyId || options.search) {
        sql += ' where'
        sqlTotalCount += ' where'
        if (options.companyId) {
          sql += ' companyId = ' + db.sqlValue(options.companyId)
          sqlTotalCount += ' companyId = ' + db.sqlValue(options.companyId)
          if (options.search) {
            sql += ' and'
            sqlTotalCount += ' and'
          }
        }
        if (options.search) {
          sql += ' username like ' + db.sqlValue(options.search)
          sqlTotalCount += ' username like ' + db.sqlValue(options.search)
        }
      }

      if (options.limit) {
        sql += ' limit ' + db.sqlValue(options.limit)
      }
      if (options.offset) {
        sql += ' offset ' + db.sqlValue(options.offset)
      }
    }
    db.select(sql, function (err, rows) {
      if (err) {
        reject(err)
      }
      else {
        // Limit and/or offset requires a second search to get a
        // total count.  Well, usually.  Can also skip if the returned
        // count is less than the limit (add in the offset to the
        // returned rows).
        if (options &&
                     (options.limit || options.offset)) {
          // If we got back less than the limit rows, then the
          // totalCount is the offset and the number of rows.  No
          // need to run the other query.
          // Handle if one or the other value is missing.
          var limit = Number.MAX_VALUE
          if (options.limit) {
            limit = options.limit
          }
          var offset = 0
          if (options.offset) {
            offset = options.offset
          }
          if (rows.length < limit) {
            resolve({ totalCount: offset + rows.length,
              records: rows })
          }
          else {
            // Must run counts query.
            db.select(sqlTotalCount, function (err, count) {
              if (err) {
                reject(err)
              }
              else {
                resolve({ totalCount: count[0].count,
                  records: rows })
              }
            })
          }
        }
        else {
          resolve({ totalCount: rows.length, records: rows })
        }
      }
    })
  })
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
exports.authorizeUser = function (username, password) {
  return new Promise(function (resolve, reject) {
    exports.retrieveUserByUsername(username).then(function (row) {
      if (row) {
        var passwordHash = new Buffer(row.passwordHash, 'hex') // Combined hash, salt
        crypto.verifyPassword(password, passwordHash, function (err, verified) {
          if (err) {
            reject(err)
          }
          else if (!verified) {
            // Password doesn't match.
            resolve(null)
          }
          else {
            // Logged in.
            resolve(row)
          }
        })
      }
      else {
        // User not found.
        resolve(null)
      }
    })
      .catch(function (err) {
        reject(err)
      })
  })
}

// Retrieves the "user profile" which is the user data and the company data in
// a single object.
//
// username - the username to retrieve the profile data for.
//
// Returns a promise that will retrieve the user profile.
exports.retrieveUserProfile = function (username) {
  return new Promise(function (resolve, reject) {
    var sql = 'select users.username, users.email, users.emailVerified, companies.name as companyName, companies.type as companyType, users.role'
    sql += ' from users, companies where users.username = '
    sql += db.sqlValue(username)
    sql += ' and users.companyId = companies.id COLLATE NOCASE'
    db.selectOne(sql, function (err, row) {
      if (err) {
        reject(err)
      }
      else {
        resolve(row)
      }
    })
  })
}

// Returns the emails of the admin users for the company as a comma-separated
// list.  This method is intended to get the admins for a user, by using the
// companyId in the user's record.
//
// companyId - the id of the company that the user is part of.
//
// Returns a promise that gets the emails.
exports.getCompanyAdmins = function (companyId) {
  return new Promise(function (resolve, reject) {
    var q = "select group_concat( email, ',' ) as emails " +
                'from users ' +
                'where name = ' + db.sqlValue(usercompany) +
                ' and role = ' + exports.ROLE_ADMIN +
                " and email not null and email != ''"
    db.select(q, function (err, rows) {
      if (err) {
        reject('Database error: ' + err)
      }
      else if (rows.length > 0) {
        resolve(rows[ 0 ].emails)
      }
      else {
        // User emails not found.
        resolve(null)
      }
    })
  })
}

// Gets the user roles from the database table
exports.getRoles = function () {
  return [
    {roleId: 1, name: 'user'},
    {roleId: 2, name: 'admin'}
  ]
  // return new Promise( function( resolve, reject ) {
  //     var sql = "select * from userRoles";
  //     db.select(sql, function( err, rows ) {
  //         if ( err ) {
  //             reject( err );
  //         }
  //         else {
  //             resolve( rows );
  //         }
  //     });
  // });
}
//* *****************************************************************************
// Email verification.
//* *****************************************************************************

// Initialize the side processes that manage email verification records.  For
// example, the process that expires old records.
exports.emailVerifyInit = function () {
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
exports.emailVerify = function (userId, username, newemail, oldemail, urlRoot) {
  return new Promise(function (resolve, reject) {
    // Need a UUID for the verification record.
    var uuid = uuidgen.v4()

    // And a timestamp.
    var timestamp = new Date().toISOString()

    var emailVerifyRecord = {}
    emailVerifyRecord.uuid = uuid
    emailVerifyRecord.userId = userId
    emailVerifyRecord.email = newemail
    emailVerifyRecord.changeRequested = timestamp

    // Write the record.
    db.insertRecord('emailVerifications', emailVerifyRecord, function (err, record) {
      if (err) {
        appLogger.log('Failed to write emailVerification record: ' + err)
        reject(err)
      }
      else {
        // Sending verification emails.
        emails.verifyEmail(oldemail,
          newemail,
          username,
          urlRoot,
          uuid)
        resolve(emailVerifyRecord)
      }
    })
  }) // End of promise
}

// Returns the email verify record based on the uuid.
//
// uuid - the UUID that IDs the record.
//
// Returns a promise that retrieves the record.
var retrieveEmailVerification = function (uuid) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('emailVerifications', 'uuid', uuid, function (err, row) {
      if (err) {
        reject(err)
      }
      else if (row == null) {
        reject(new httpError.NotFound())
      }
      else {
        resolve(row)
      }
    })
  })
}

// Deletes the email verify record based on the uuid.
//
// uuid - the UUID that IDs the record.
//
// Returns a promise that deletes the record.
var deleteEmailVerification = function (uuid) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('emailVerifications', 'uuid', uuid, function (err, data) {
      if (err) {
        reject(err)
      }
      else {
        resolve(data)
      }
    })
  })
}

// Verifies the email with the given UUID.
exports.handleEmailVerifyResponse = function (uuid, type, source) {
  return new Promise(function (resolve, reject) {
    retrieveEmailVerification(uuid).then(function (ev) {
      if (!ev) {
        appLogger.log('EmailVerify record not found. UUID = ' + uuid +
                             ', type = ' + type +
                             ', source = ' + source)
        reject(new httpError.NotFound())
      }
      else {
        // Got the emailVerify record.  Get the associated user.
        exports.retrieveUser(ev.userId).then(function (user) {
          var usrUpd = {}
          usrUpd.id = user.id
          if (!user) {
            appLogger.log('User for EmailVerify record not found. UUID = ' + uuid +
                                     ', type = ' + type +
                                     ', source = ' + source)
            reject(new httpError.NotFound())
          }
          else {
            // Got the user.  Do what they requested.
            if (type == 'accept') {
              usrUpd.emailVerified = true
            }
            else if (type == 'reject') {
              emails.notifyAdminsAboutReject(user, source)
              usrUpd.email = user.lastVerifiedEmail
              usrUpd.lastVerifiedEmail = ''
              usrUpd.emailVerified = true
            }

            // Save the user record and delete the emailVerify
            // record.
            exports.updateUser(usrUpd)
              .then(deleteEmailVerification(uuid))
              .then(function () {
                resolve()
              })
              .catch(function (err) {
                appLogger.log('Update for EmailVerify failed. UUID = ' + uuid +
                                         ', type = ' + type +
                                         ', source = ' + source +
                                        ': ' + err)
                reject(new httpError.InternalServerError())
              })
          } // End of get user
        })
          .catch(function (err) {
            appLogger.log('User retrieval for emailVerification failed. UUID = ' + uuid +
                                 ', type = ' + type +
                                 ', source = ' + source +
                                ': ' + err)
            reject(err)
          }) // End of get user
      } // End of got ev record.
    })
      .catch(function (err) {
        appLogger.log('EmailVerification mnot found. UUID = ' + uuid +
                         ', type = ' + type +
                         ', source = ' + source +
                        ': ' + err)
        reject(err)
      }) // End of get ev record
  }) // End of promise
}

// We run this "periodically" to delete old emailVerify records.  We user
// the handler code above with a "reject" type and an "expired" source so
// the handling and reporting code is in one place.
var expireEmailVerify = function () {
  appLogger.log('Running expiration of email verify records')
  // 14 day limit on email changes.
  var timedOut = new Date()
  // Move now back 14 days.
  timedOut.setDate(timedOut.getDate() - 14)
  var query = "SELECT * FROM emailVerify WHERE changeRequested < '" +
                timedOut.toISOString() + "';"
  db.select(query, function (err, rows) {
    if (err) {
      appLogger.log('Error getting expired emailVerify records: ' + err)
    }
    else {
      appLogger.log(rows.length + ' email verify records to be expired')
      // Expire the records
      for (var i = 0; i < rows.length; ++i) {
        var row = rows[ i ]
        exports.handleEmailVerifyResponse(
          row.uuid,
          'reject',
          'expired verification request',
          function (pugFile, pugData) {
            // Ignore the returned data - that's for UI.  The reporting
            // happened in the handleEmailVerifyResponse() call.
          })
      } // End of for each expired record.
    } // End of have expired records (else)
  }) // End of get expired records callback.
}
