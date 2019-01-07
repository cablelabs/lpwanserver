// Database implementation.
var db = require('../../../lib/dbsqlite.js')

// Error reporting
var httpError = require('http-errors')

//* *****************************************************************************
// NetworkTypes database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the networkTypes record.
//
// name  - the name of the networkType
//
// Returns the promise that will execute the create.
exports.createNetworkType = function (name) {
  return new Promise(function (resolve, reject) {
    // Create the record.
    var networkType = {}
    networkType.name = name

    // OK, save it!
    db.insertRecord('networkTypes', networkType, function (err, record) {
      if (err) {
        reject(err)
      }
      else {
        resolve(record)
      }
    })
  })
}

// Retrieve a networkType record by id.
//
// id - the record id of the networkType.
//
// Returns a promise that executes the retrieval.
exports.retrieveNetworkType = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('networkTypes', 'id', id, function (err, rec) {
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

// Update the networkType record.
//
// networkType - the updated record.  Note that the id must be unchanged from
//               retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateNetworkType = function (networkType) {
  return new Promise(function (resolve, reject) {
    db.updateRecord('networkTypes', 'id', networkType, function (err, row) {
      if (err) {
        reject(err)
      }
      else {
        resolve(row)
      }
    })
  })
}

// Delete the networkType record.
//
// networkTypeId - the id of the networkType record to delete.
//
// Returns a promise that performs the delete.
exports.deleteNetworkType = function (networkTypeId) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('networkTypes', 'id', networkTypeId, function (err, rec) {
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

// Gets all networkTypes from the database.
//
// Returns a promise that does the retrieval.
exports.retrieveAllNetworkTypes = function () {
  return new Promise(function (resolve, reject) {
    var sql = 'SELECT * from networkTypes;'
    db.select(sql, function (err, rows) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rows)
      }
    })
  })
}

// Retrieve the networkType by name.
//
// Returns a promise that does the retrieval.
exports.retrieveNetworkTypebyName = function (name) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('networkTypes', 'name', name, function (err, rec) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rec)
      }
    })
  })
}
