// Define the parts of the rest server

// General libraries in use in this module.
var appLogger = require('./lib/appLogger.js')

// Rest API Definitions
var restSessionsAPI = require('./restSessions.js')
var restUsersAPI = require('./restUsers.js')
var restCompaniesAPI = require('./restCompanies.js')
var restPasswordPoliciesAPI = require('./restPasswordPolicies.js')
var restNetworkProtocolsAPI = require('./restNetworkProtocols.js')
var restNetworksAPI = require('./restNetworks.js')
var restCompanyNetworkTypeLinksAPI = require('./restCompanyNetworkTypeLinks.js')
var restReportingProtocolsAPI = require('./restReportingProtocols.js')
var restApplicationsAPI = require('./restApplications.js')
var restApplicationNetworkTypeLinksAPI = require('./restApplicationNetworkTypeLinks.js')
var restDevicesAPI = require('./restDevices.js')
var restDeviceProfilesAPI = require('./restDeviceProfiles.js')
var restDeviceNetworkTypeLinksAPI = require('./restDeviceNetworkTypeLinks.js')
var restNetworkTypesAPI = require('./restNetworkTypes.js')
var restNetworkProvidersAPI = require('./restNetworkProviders.js')

// The abstract data model.
var ModelAPI = require('./models/ModelAPI.js')

// The RestServer for use in methods called without proper scope.
var restServer

function RestServer (app) {
  // Based on the initialization type, create the models that will
  // use the underlying data.  Each module gets the type from config.
  // Pass around the dependancies as well.
  // Once a data model is initialized, set up the rest API path using the
  // local rest*API.initialize() method.
  restServer = this

  // Set up the model for the application.
  this.modelAPI = new ModelAPI(app)

  // Companies.
  restCompaniesAPI.initialize(app, this)

  // Password policies.  Manages password rules for companies.
  restPasswordPoliciesAPI.initialize(app, this)

  // Users.  And start the user email verification background task that
  // expires old email verification records.
  restUsersAPI.initialize(app, this)

  // The session model, which uses users (for login).
  restSessionsAPI.initialize(app, this)

  // The networkProtocol model.
  restNetworkProtocolsAPI.initialize(app, this)

  // The network model.  Needs the protocols to access the correct api.
  restNetworksAPI.initialize(app, this)

  // The network provider model.
  restNetworkProvidersAPI.initialize(app, this)

  // The network type model.
  restNetworkTypesAPI.initialize(app, this)

  // The companyNetworkTypeLink model.
  restCompanyNetworkTypeLinksAPI.initialize(app, this)

  // The NetworkProvisioningFields model.
  // restNetworkProvisioningFieldsAPI.initialize( app, this );

  // The reportingProtocol model.
  restReportingProtocolsAPI.initialize(app, this)

  // The applicationNetworkTypeLink model.
  restApplicationNetworkTypeLinksAPI.initialize(app, this)

  // The application model.  Needs the express app because when it starts, it
  // may need to add new endpoints to receive data from remote networks.
  restApplicationsAPI.initialize(app, this)

  // The device model.  It uses applications for some validation.
  restDeviceProfilesAPI.initialize(app, this)

  // The device model.  It uses applications for some validation.
  restDevicesAPI.initialize(app, this)

  // The applicationNetworkTypeLink model.
  restDeviceNetworkTypeLinksAPI.initialize(app, this)
}

RestServer.prototype.initialize = async function initializeRestServer () {
  await this.modelAPI.initialize()
}

// *******************************************************************
// * Authentication/utility methods for REST interface methods.
// *******************************************************************

// A standard way to handle responses to requests.  This should be the last
// step of any REST request handler (or use responseJson() below).
//
// res     - The reponse object to users
// status  - The status to return.  Can be a number (assumed to be an HTTP
//           error number), or an http-errors object that has the embedded
//           status and message fields.
// content - The content to send to the caller in the response body.
RestServer.prototype.respond = function (res, status, content, json) {
  // If we have a status, it may be a number (assume Http status code),
  // or it may be an error object with a statusCode.  Figure it out, do
  // the right thing.
  if (status) {
    if (typeof status === 'number') {
      res.status(status)
    }
    else {
      if (status.statusCode) {
        res.status(status.statusCode)
      }
      else {
        // Blame the user.
        appLogger.log('Respond got status object without statusCode (returning 400): ' + JSON.stringify(status))
        res.status(400)
      }
    }
  }
  else {
    // No status implied success.
    res.status(200)
  }

  // Content to return in the message body.
  if (content) {
    if (json) {
      res.json(content)
    }
    else {
      res.send(content)
    }
  }
  else if (status && status.message) {
    res.send(status.message)
  }
  else {
    res.send('')
  }

  // Send it NOW.
  res.end()
}

// A standard way to handle responses to requests when the body contains JSON
// content.  This should be the last step of any REST request handler (or use
// response() above).
//
// res     - The reponse object to users
// status  - The status to return.  Can be a number (assumed to be an HTTP
//           error number), or an http-errors object that has the embedded
//           status and message fields.
// content - The json content to send to the caller in the response body.  This
//           content is formatted to a string.
RestServer.prototype.respondJson = function (res, status, jsonData) {
  // Convert the Json to a string and pass off to regular call
  restServer.respond(res, status, JSON.stringify(jsonData))
}

// A function redirect that verifies that the request comes with
// authentication as defined by the session implementation.  We just point
// off to the session authorization method, but keep this local variable
// here in case we decide to add more local functionality.  Also, it makes
// the references to this method easier to read/type.
//
// req  - The rest request object to check for authorization tokens.
// res  - The rest response object to be notified if not authorized.
// next - The next step in processing to perform.
RestServer.prototype.isLoggedIn = function (req, res, next) {
  restServer.modelAPI.sessions.verifyAuthorization(req, res, next)
}

// Verifies that the user is a member of an admin company.
//
// req  - The rest request object to check for authorization tokens.
// res  - The rest response object to be notified if not authorized.
// next - The next step in processing to perform.
RestServer.prototype.isAdminCompany = function (req, res, next) {
  if (req.company.type === 'ADMIN') {
    next()
  }
  else {
    restServer.respond(res, 403, 'User is not part of admin company')
  }
}

// Verifies that the user is a member of an admin company or is an admin
// user of a company.  Note: isLoggedIn and fetchCompany must be called prior
// to this method.
//
// req  - The rest request object to check for authorization tokens.
// res  - The rest response object to be notified if not authorized.
// next - The next step in processing to perform.
RestServer.prototype.isAdmin = function (req, res, next) {
  if (req.company.type === 'ADMIN' || req.user.role === 'ADMIN') {
    next()
  }
  else {
    restServer.respond(res, 403, 'User is not admin')
  }
}

// Gets the user's company into the req object if needed by the request
// processing code.  Note: isLoggedIn and fetchCompany must be called prior
// to this method.
//
// req  - The rest request object to get the company profile.
// res  - The rest response object to be notified if the company is not
//        available.
// next - The next step in processing to perform.
RestServer.prototype.fetchCompany = function (req, res, next) {
  if (req.user) {
    restServer.modelAPI.companies.load(req.user.company.id).then(function (company) {
      if (company) {
        req.company = company
        next()
      }
      else {
        restServer.respond(res, 400, "User's company not found")
      }
    })
      .catch(function (err) {
        restServer.respond(res, err, "User's company lookup failed: " + err)
      })
  }
  else {
    restServer.respond(res, 401, 'No user')
  }
}

module.exports = RestServer
