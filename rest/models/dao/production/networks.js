// Database implementation.
var db = require('../../../lib/dbsqlite.js')

// Error reporting
var httpError = require('http-errors')

//* *****************************************************************************
// Networks database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the network record.
//
// name                      - the name of the network to display for selection
// networkProviderId         - the id of the networkProvider that manages this
//                             network.
// networkTypeId             - the id of the networkType this network supports
// networkProtocolId         - the id of the networkProtocol this network uses
// baseUrl                   - the root of the URL to be used by the
//                             networkProtocol to access the network api.
// securityData              - Data used by the networkProtocol to access the
//                             remote system.  Could be a JWT token or other
//                             login credentials.
//
// Returns the promise that will execute the create.
exports.createNetwork = function (name, networkProviderId, networkTypeId, networkProtocolId, baseUrl, securityData) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    var nwk = {}
    nwk.name = name
    nwk.networkProviderId = networkProviderId
    nwk.networkTypeId = networkTypeId
    nwk.networkProtocolId = networkProtocolId
    nwk.baseUrl = baseUrl
    nwk.securityData = securityData

    // OK, save it!
    db.insertRecord('networks', nwk, function (err, record) {
      if (err) {
        reject(err)
      }
      else {
        resolve(record)
      }
    })
  })
}

// Retrieve a network record by id.
//
// id - the record id of the network.
//
// Returns a promise that executes the retrieval.
exports.retrieveNetwork = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('networks', 'id', id, function (err, rec) {
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

// Update the network record.
//
// network- the updated record.  Note that the id must be unchanged
//          from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateNetwork = function (np) {
  return new Promise(function (resolve, reject) {
    db.updateRecord('networks', 'id', np, function (err, row) {
      if (err) {
        reject(err)
      }
      else {
        resolve(row)
      }
    })
  })
}

// Delete the network record.
//
// networkId - the id of the network record to delete.
//
// Returns a promise that performs the delete.
exports.deleteNetwork = function (networkId) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('networks', 'id', networkId, function (err, rec) {
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

/**
 * Retrieves a subset of the networks in the system given the options.
 *
 * Options include limits on the number of networks returned, the offset to
 * the first network returned (together giving a paging capability), a
 * search string on network name, and networkProtocolId.
 *
 */
exports.retrieveNetworks = function (options) {
  return new Promise(function (resolve, reject) {
    var sql = 'select * from networks'
    var sqlTotalCount = 'select count(id) as count from networks'
    if (options) {
      if (options.search ||
                 options.networkProtocolId ||
                 options.networkTypeId) {
        sql += ' where'
        sqlTotalCount += ' where'
      }
      var needsAnd = false
      if (options.search) {
        sql += ' name like ' + db.sqlValue(options.search)
        sqlTotalCount += ' name like ' + db.sqlValue(options.search)
        needsAnd = true
      }
      if (options.networkProviderId) {
        if (needsAnd) {
          sql += ' and'
          sqlTotalCount += ' and'
        }
        sql += ' networkProviderId = ' + db.sqlValue(options.networkProviderId)
        sqlTotalCount += ' networkProviderId = ' + db.sqlValue(options.networkProviderId)
        needsAnd = true
      }
      if (options.networkTypeId) {
        if (needsAnd) {
          sql += ' and'
          sqlTotalCount += ' and'
        }
        sql += ' networkTypeId = ' + db.sqlValue(options.networkTypeId)
        sqlTotalCount += ' networkTypeId = ' + db.sqlValue(options.networkTypeId)
        needsAnd = true
      }
      if (options.networkProtocolId) {
        if (needsAnd) {
          sql += ' and'
          sqlTotalCount += ' and'
        }
        sql += ' networkProtocolId = ' + db.sqlValue(options.networkProtocolId)
        sqlTotalCount += ' networkProtocolId = ' + db.sqlValue(options.networkProtocolId)
        needsAnd = true
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
