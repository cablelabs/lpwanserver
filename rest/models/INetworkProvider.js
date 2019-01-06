// Configuration access.
var nconf = require('nconf')

//* *****************************************************************************
// The NetworkProvider interface.
//* *****************************************************************************
// Class constructor.
//
// Loads the implementation for the networkProvider interface based on the passed
// subdirectory name.  The implementation file networkProviders.js is to be found in
// that subdirectory of the models/dao directory (Data Access Object).
//
// implPath - The subdirectory to get the dao implementation from.
//
function NetworkProvider () {
  this.impl = require('./dao/' +
                             nconf.get('impl_directory') +
                             '/networkProviders.js')
}

// Retrieves a subset of the networkProviders in the system given the options.
//
// Options include limits on the number of networkProviders returned, the offset
// to the first networkProvider returned (together giving a paging capability),
// and a search string on networkProvider name.
NetworkProvider.prototype.retrieveNetworkProviders = function (options) {
  return this.impl.retrieveNetworkProviders(options)
}

// Retrieve a networkProvider record by id.
//
// id - the record id of the networkProvider.
//
// Returns a promise that executes the retrieval.
NetworkProvider.prototype.retrieveNetworkProvider = function (id) {
  return this.impl.retrieveNetworkProvider(id)
}

// Create the networkProvider record.
//
// name  - the name of the networkProvider
//
// Returns the promise that will execute the create.
NetworkProvider.prototype.createNetworkProvider = function (name) {
  return this.impl.createNetworkProvider(name)
}

// Update the networkProvider record.
//
// networkProvider - the updated record.  Note that the id must be unchanged from
//           retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
NetworkProvider.prototype.updateNetworkProvider = function (record) {
  return this.impl.updateNetworkProvider(record)
}

// Delete the networkProvider record.
//
// networkProviderId - the id of the networkProvider record to delete.
//
// Returns a promise that performs the delete.
NetworkProvider.prototype.deleteNetworkProvider = function (id) {
  return this.impl.deleteNetworkProvider(id)
}

module.exports = NetworkProvider
