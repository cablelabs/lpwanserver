// Configuration access.
var nconf = require('nconf')

// Json web token handling.
var jwt = require('jsonwebtoken')

// Errors.
var httpError = require('http-errors')

//* *****************************************************************************
// The Session interface.
//
// The session interface keeps track of the client's resources in use,
// especially their connections to remote networks
//* *****************************************************************************
function Session (token) {
  this.jwtToken = token
  this.networkSessions = {}
}

// Yes, it is redundant to keep api pointers here, BUT, if the api changes while
// a session is active, this allows the session disconnect call to access the
// original API.
Session.prototype.addConnection = function (networkName, connection, api) {
  this.networkSessions[ networkName ] = { connection: connection,
    api: api }
}

Session.prototype.dropConnections = function () {
  return new Promise(function (resolve, reject) {
    // Get the disconnect promises for each connection.
    var promises = []
    for (var network in this.networkSessions) {
      promises.pushBack(network.api.disconnect(network.connection))
    }
    Promise.all(promises).then(function (results) {
      resolve()
    })
      .catch(function (err) {
        reject(err)
      })
  })
}

module.exports = Session
