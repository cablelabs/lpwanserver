// Database implementation.
var db = require('../../../lib/dbsqlite.js')

// Error reporting
var httpError = require('http-errors')

//* *****************************************************************************
// NetworkProtocols database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the networkProtocol record.
//
// name            - the name of the network protocol to display for selection
// protocolType    - the protocol type, such as "LoRa", "NB-IoT", etc.
// protocolHandler - the filename for the code that supports the general network
//                   protocol api for this specific protocol.
//
// Returns the promise that will execute the create.
exports.createNetworkProtocol = function (name, networkTypeId, protocolHandler) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    var np = {}
    np.name = name
    np.networkTypeId = networkTypeId
    np.protocolHandler = protocolHandler

    // OK, save it!
    db.insertRecord('networkProtocols', np, function (err, record) {
      if (err) {
        reject(err)
      } else {
        resolve(record)
      }
    })
  })
}

exports.upsertNetworkProtocol = function (np) {
  let me = this
  return new Promise(function (resolve, reject) {
    me.retrieveNetworkProtocols({ search: np.name })
      .then((oldNp) => {
        if (oldNp.totalCount > 0) {
          oldNp = oldNp.records[0]
          console.log('Updating ' + oldNp.name)
          resolve(me.updateNetworkProtocol(np))
        } else {
          console.log('Creating ' + np.name)
          resolve(me.createNetworkProtocol(np.name, np.networkTypeId, np.protocolHandler))
        }
      })
      .catch((err) => {
        reject(err)
      })
  })
}

// Retrieve a networkProtocol record by id.
//
// id - the record id of the networkProtocol.
//
// Returns a promise that executes the retrieval.
exports.retrieveNetworkProtocol = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('networkProtocols', 'id', id, function (err, rec) {
      if (err) {
        reject(err)
      } else if (!rec) {
        reject(new httpError.NotFound())
      } else {
        resolve(rec)
      }
    })
  })
}

// Update the networkProtocol record.
//
// networkProtocol - the updated record.  Note that the id must be unchanged
//                   from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateNetworkProtocol = function (np) {
  return new Promise(function (resolve, reject) {
    db.updateRecord('networkProtocols', 'id', np, function (err, row) {
      if (err) {
        reject(err)
      } else {
        resolve(row)
      }
    })
  })
}

// Delete the networkProtocol record.
//
// networkProtocolId - the id of the networkProtocol record to delete.
//
// Returns a promise that performs the delete.
exports.deleteNetworkProtocol = function (networkProtocolId) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('networkProtocols', 'id', networkProtocolId, function (err, rec) {
      if (err) {
        reject(err)
      } else {
        resolve(rec)
      }
    })
  })
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Gets all networkProtocols from the database.
//
// Returns a promise that does the retrieval.
exports.retrieveAllNetworkProtocols = function () {
  return new Promise(function (resolve, reject) {
    var sql = 'SELECT * from networkProtocols'
    db.select(sql, function (err, rows) {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

/**
 * Retrieves a subset of the networkProtocols in the system given the options.
 *
 * Options include limits on the number of companies returned, the offset to
 * the first company returned (together giving a paging capability), and a
 * search string on networkProtocol name or type.
 *
 */
exports.retrieveNetworkProtocols = function (options) {
  return new Promise(function (resolve, reject) {
    var sql = 'select * from networkProtocols'
    var sqlTotalCount = 'select count(id) as count from networkProtocols'
    var needsAnd = false
    if (options) {
      if (options.search || options.networkTypeId) {
        sql += ' where'
        sqlTotalCount += ' where'
      }
      if (options.search) {
        sql += ' name like ' + db.sqlValue(options.search)
        sqlTotalCount += ' name like ' + db.sqlValue(options.search)
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
      } else {
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
          } else {
            // Must run counts query.
            db.select(sqlTotalCount, function (err, count) {
              if (err) {
                reject(err)
              } else {
                resolve({ totalCount: count[0].count,
                  records: rows })
              }
            })
          }
        } else {
          resolve({ totalCount: rows.length, records: rows })
        }
      }
    })
  })
}
