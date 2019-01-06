// Database implementation.
var db = require('../../../lib/dbsqlite.js')

// Logging
var appLogger = require('../../../lib/appLogger.js')

// Application access
var app = require('./applications.js')

// Error reporting
var httpError = require('http-errors')

//* *****************************************************************************
// ApplicationNetworkTypeLinks database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the applicationNetworkTypeLinks record.
//
// applicationId     - The id for the application this link is being created for
// networkTypeId     - The id for the network the application is linked to
// networkSettings   - The settings required by the network protocol in json
//                     format
// validateCompanyId - If supplied, the application MUST belong to this company.
//
// Returns the promise that will execute the create.
exports.createApplicationNetworkTypeLink = function (applicationId, networkTypeId, networkSettings, validateCompanyId) {
  return new Promise(function (resolve, reject) {
    exports.validateCompanyForApplication(validateCompanyId, applicationId).then(function () {
      // Create the user record.
      var anl = {}
      anl.applicationId = applicationId
      anl.networkTypeId = networkTypeId
      anl.networkSettings = JSON.stringify(networkSettings)

      // OK, save it!
      db.insertRecord('applicationNetworkTypeLinks', anl, function (err, record) {
        if (err) {
          reject(err)
        }
        else {
          resolve(record)
        }
      })
    })
      .catch(function (err) {
        reject(err)
      })
  })
}

// Retrieve a applicationNetworkTypeLinks record by id.
//
// id - the record id of the applicationNetworkTypeLinks record.
//
// Returns a promise that executes the retrieval.
exports.retrieveApplicationNetworkTypeLink = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('applicationNetworkTypeLinks', 'id', id, function (err, rec) {
      if (err) {
        reject(err)
      }
      else if (!rec) {
        reject(new httpError.NotFound())
      }
      else {
        // Stored in the database as a string, make it an object.
        rec.networkSettings = JSON.parse(rec.networkSettings)
        resolve(rec)
      }
    })
  })
}

// Update the applicationNetworkTypeLinks record.
//
// applicationNetworkTypeLinks - the updated record. Note that the id must be
//                           unchanged from retrieval to guarantee the same
//                           record is updated.
// validateCompanyId       - If supplied, the application MUST belong to this
//                           company.
//
// Returns a promise that executes the update.
exports.updateApplicationNetworkTypeLink = function (applicationNetworkTypeLink, validateCompanyId) {
  return new Promise(async function (resolve, reject) {
    exports.validateCompanyForApplicationNetworkTypeLink(validateCompanyId, applicationNetworkTypeLink.id).then(function () {
      if (applicationNetworkTypeLink.networkSettings) {
        applicationNetworkTypeLink.networkSettings = JSON.stringify(applicationNetworkTypeLink.networkSettings)
      }
      db.updateRecord('applicationNetworkTypeLinks', 'id', applicationNetworkTypeLink, function (err, row) {
        if (err) {
          reject(err)
        }
        else {
          resolve(row)
        }
      })
    })
      .catch(function (err) {
        appLogger.log('Error validating company ' + validateCompanyId + ' for ' + 'applicationNetworkLink ' + applicationNetworkTypeLink.id + '.')
        reject(err)
      })
  })
}

// Delete the applicationNetworkTypeLinks record.
//
// id                - the id of the applicationNetworkTypeLinks record to delete.
// validateCompanyId - If supplied, the application MUST belong to this company.
//
// Returns a promise that performs the delete.
exports.deleteApplicationNetworkTypeLink = function (id, validateCompanyId) {
  return new Promise(function (resolve, reject) {
    exports.validateCompanyForApplicationNetworkTypeLink(validateCompanyId, id).then(function () {
      db.deleteRecord('applicationNetworkTypeLinks', 'id', id, function (err, rec) {
        if (err) {
          reject(err)
        }
        else {
          resolve(rec)
        }
      })
    })
      .catch(function (err) {
        reject(err)
      })
  })
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Retrieves a subset of the applicationNetworkTypeLinks in the system given the options.
//
// Options include the applicationId, and the networkTypeId.
//
// Returns a promise that does the retrieval.
exports.retrieveApplicationNetworkTypeLinks = function (options) {
  return new Promise(function (resolve, reject) {
    var sql = 'select anl.* from applicationNetworkTypeLinks anl'
    var sqlTotalCount = 'select count( anl.id ) as count from applicationNetworkTypeLinks anl'
    if (options) {
      if (options.companyId) {
        sql += ', applications a'
        sqlTotalCount += ', applications a'
      }
      if (options.companyId || options.applicationId || options.networkTypeId) {
        var needsAnd = false
        sql += ' where'
        sqlTotalCount += ' where'
        if (options.applicationId) {
          sql += ' anl.applicationId = ' + db.sqlValue(options.applicationId)
          sqlTotalCount += ' anl.applicationId = ' + db.sqlValue(options.applicationId)
          needsAnd = true
        }
        if (options.networkTypeId) {
          if (needsAnd) {
            sql += ' and'
            sqlTotalCount += ' and'
          }
          sql += ' anl.networkTypeId = ' + db.sqlValue(options.networkTypeId)
          sqlTotalCount += ' anl.networkTypeId = ' + db.sqlValue(options.networkTypeId)
          needsAnd = true
        }
        if (options.companyId) {
          if (needsAnd) {
            sql += ' and'
            sqlTotalCount += ' and'
          }
          sql += ' anl.applicationId = a.id and a.companyId = ' + db.sqlValue(options.companyId)
          sqlTotalCount += ' anl.applicationId = a.id and a.companyId = ' + db.sqlValue(options.companyId)
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
        rows.forEach(function (row) {
          // Stored in the database as a string, make it an object.
          row.networkSettings = JSON.parse(row.networkSettings)
        })
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

/***************************************************************************
 * Validation methods
 ***************************************************************************/
exports.validateCompanyForApplication = function (companyId, applicationId) {
  return new Promise(function (resolve, reject) {
    // undefined companyId is always valid - means the caller is a used for
    // an admin company, so they can set up any links.
    if (!companyId) {
      resolve()
    }
    else {
      app.retrieveApplication(applicationId).then(function (a) {
        if (a.companyId !== companyId) {
          reject(new httpError.Unauthorized())
        }
        else {
          resolve()
        }
      })
        .catch(function (err) {
          reject(err)
        })
    }
  })
}

exports.validateCompanyForApplicationNetworkTypeLink = function (companyId, antlId) {
  return new Promise(async function (resolve, reject) {
    // undefined companyId is always valid - means the caller is a used for
    // an admin company, so they can set up any links.  Yes, this is
    // redundant with the application validator, but it saves the database
    // hit.
    if (!companyId) {
      resolve()
    }
    else {
      try {
        // Get the record we're validating.
        var antl = await exports.retrieveApplicationNetworkTypeLink(antlId)
        // Validate he record's applicationm against the company.
        await exports.validateCompanyForApplication(companyId, antl.applicationId)
        resolve()
      }
      catch (err) {
        reject(err)
      };
    }
  })
}
