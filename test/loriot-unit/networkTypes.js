var networkType = {}

exports.createNetworkType = function (name) {
  return new Promise(function (resolve, reject) {
    // Create the record.
    networkType.id = 1
    networkType.name = name
  })
}

// Retrieve a networkType record by id.
//
// id - the record id of the networkType.
//
// Returns a promise that executes the retrieval.
exports.retrieveNetworkType = function (id) {
  return new Promise(function (resolve, reject) {
    resolve(networkType)
  })
}

exports.updateNetworkType = function (nt) {
  return new Promise(function (resolve, reject) {
    networkType = nt
    resolve(networkType)
  })
}

// Delete the networkType record.
//
// networkTypeId - the id of the networkType record to delete.
//
// Returns a promise that performs the delete.
exports.deleteNetworkType = function (networkTypeId) {
  return new Promise(function (resolve, reject) {
    networkType = {}
    resolve(networkType)
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
    resolve(networkType)
  })
}

// Retrieve the networkType by name.
//
// Returns a promise that does the retrieval.
exports.retrieveNetworkTypebyName = function (name) {
  return new Promise(function (resolve, reject) {
    resolve(networkType)
  })
}
