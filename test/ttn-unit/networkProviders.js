var networkProvider = {}

exports.createNetworkProvider = function (name) {
  return new Promise(function (resolve, reject) {
    networkProvider.name = name
    resolve(networkProvider)
  })
}

// Retrieve a networkProvider record by id.
//
// id - the record id of the networkProvider.
//
// Returns a promise that executes the retrieval.
exports.retrieveNetworkProvider = function (id) {
  return new Promise(function (resolve, reject) {
    resolve(networkProvider)
  })
}

// Update the networkProvider record.
//
// networkProvider - the updated record.  Note that the id must be unchanged
//                   from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateNetworkProvider = function (np) {
  return new Promise(function (resolve, reject) {
    networkProvider = np
    resolve(networkProvider)
  })
}

// Delete the networkProvider record.
//
// networkProviderId - the id of the networkProvider record to delete.
//
// Returns a promise that performs the delete.
exports.deleteNetworkProvider = function (networkProviderId) {
  return new Promise(function (resolve, reject) {
    resolve(networkProvider)
  })
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Gets all networkProviders from the database.
//
// Returns a promise that does the retrieval.
exports.retrieveAllNetworkProviders = function () {
  return new Promise(function (resolve, reject) {
    resolve(networkProvider)
  })
}

// Retrieve the networkProvider by name.
//
// Returns a promise that does the retrieval.
exports.retrieveNetworkProviders = function (options) {
  return new Promise(function (resolve, reject) {
    resolve(networkProvider)
  })
}
