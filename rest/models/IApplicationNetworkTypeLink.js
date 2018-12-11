// General libraries in use in this module.
var appLogger = require('../lib/appLogger.js')

// Configuration access.
var nconf = require('nconf')

// Error reporting
var httpError = require('http-errors')

var modelAPI

//* *****************************************************************************
// The ApplicationNetworkTypeLink interface.
//* *****************************************************************************
// Class constructor.
//
// Loads the implementation for the applicationNetworkTypeLink interface based on
// the configured subdirectory name.  The implementation file
// applicationNetworkTypeLink.js is to be found in that subdirectory of the
// models/dao directory (Data Access Object).
//
// server - The modelAPI object, allowing use of the other APIs.
//
function ApplicationNetworkTypeLink (server) {
  this.impl = new require('./dao/' +
                             nconf.get('impl_directory') +
                             '/applicationNetworkTypeLinks.js')

  modelAPI = server
}

// Create the applicationNetworkTypeLinks record.
//
// applicationId     - The id for the application this link is being created for
// networkTypeId         - The id for the network the application is linked to
// networkSettings   - The settings required by the network protocol in json
//                     format
// validateCompanyId - The id of the company this application SHOULD be part of.
//                     Usually this is tied to the user creating the link,
//                     though a global admin could supply null here.
//
// Returns the promise that will execute the create.
ApplicationNetworkTypeLink.prototype.createApplicationNetworkTypeLink = function (applicationId, networkTypeId, networkSettings, validateCompanyId) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      var rec = await me.impl.createApplicationNetworkTypeLink(applicationId, networkTypeId, networkSettings, validateCompanyId)
      var logs = await modelAPI.networkTypeAPI.addApplication(networkTypeId, applicationId, networkSettings)
      rec.remoteAccessLogs = logs
      resolve(rec)
    }
    catch (err) {
      appLogger.log('Error creating applicationNetworkTypeLink: ' + err)
      reject(err)
    }
  })
}

ApplicationNetworkTypeLink.prototype.createRemoteApplicationNetworkTypeLink = function (applicationId, networkTypeId, networkSettings, validateCompanyId) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      var rec = await me.impl.createApplicationNetworkTypeLink(applicationId, networkTypeId, networkSettings, validateCompanyId)
      resolve(rec)
    }
    catch (err) {
      appLogger.log('Error creating applicationNetworkTypeLink: ' + err)
      reject(err)
    }
  })
}

// Retrieve a applicationNetworkTypeLinks record by id.
//
// id - the record id of the applicationNetworkTypeLinks record.
//
// Returns a promise that executes the retrieval.
ApplicationNetworkTypeLink.prototype.retrieveApplicationNetworkTypeLink = function (id) {
  return this.impl.retrieveApplicationNetworkTypeLink(id)
}

// Update the applicationNetworkTypeLinks record.
//
// applicationNetworkTypeLinks - the updated record.  Note that the id must be
//                           unchanged from retrieval to guarantee the same
//                           record is updated.
// validateCompanyId       - The id of the company this application SHOULD be
//                           part of.  Usually this is tied to the user
//                           creating the link, though a global admin could
//                           supply null here (no need to validate).
//
// Returns a promise that executes the update.
ApplicationNetworkTypeLink.prototype.updateApplicationNetworkTypeLink = function (applicationNetworkTypeLink, validateCompanyId) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      var rec = await me.impl.updateApplicationNetworkTypeLink(applicationNetworkTypeLink, validateCompanyId)
      var logs = await modelAPI.networkTypeAPI.pushApplication(rec.networkTypeId, rec, rec.networkSettings)
      rec.remoteAccessLogs = logs
      resolve(rec)
    }
    catch (err) {
      appLogger.log('Error updating applicationNetworkTypeLink: ' + err)
      reject(err)
    }
  })
}

ApplicationNetworkTypeLink.prototype.updateRemoteApplicationNetworkTypeLink = function (applicationNetworkTypeLink, validateCompanyId) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      var rec = await me.impl.updateApplicationNetworkTypeLink(applicationNetworkTypeLink, validateCompanyId)
      resolve(rec)
    }
    catch (err) {
      appLogger.log('Error updating applicationNetworkTypeLink: ' + err)
      reject(err)
    }
  })
}

// Delete the applicationNetworkTypeLinks record.
//
// id                - the id of the applicationNetworkTypeLinks record to
//                     delete.
// validateCompanyId - The id of the company this application SHOULD be part of.
//                     Usually this is tied to the user creating the link,
//                     though a global admin could supply null here (no need to
//                     validate).
//
// Returns a promise that performs the delete.
ApplicationNetworkTypeLink.prototype.deleteApplicationNetworkTypeLink = function (id, validateCompanyId) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      var rec = await me.impl.retrieveApplicationNetworkTypeLink(id)
      // Since we clear the remote networks before we delete the local
      // record, validate the company now, if required.
      if (validateCompanyId) {
        var app = await modelAPI.applications.retrieveApplication(rec.applicationId)
        if (validateCompanyId != app.companyId) {
          reject(new httpError.Unauthorized())
          return
        }
      }
      // Delete devicenetworkTypeLinks
      let dntls = await modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks({ applicationId: id })
      let recs = dntls.records
      for (let i = 0; i < recs.length; ++i) {
        await modelAPI.deviceNetworkTypeLinks.deleteDeviceNetworkTypeLink(recs[ i ].id)
      }

      // Don't delete the local record until the remote operations complete.
      var logs = await modelAPI.networkTypeAPI.deleteApplication(rec.networkTypeId, rec.applicationId)
      await me.impl.deleteApplicationNetworkTypeLink(id)
      resolve(logs)
    }
    catch (err) {
      appLogger.log('Error deleting applicationNetworkTypeLink: ' + err)
      reject(err)
    }
  })
}

// Push the applicationNetworkTypeLinks record.
//
// applicationNetworkTypeLinks - the record to be pushed.  Note that the id must be
//                           unchanged from retrieval to guarantee the same
//                           record is updated.
// validateCompanyId       - The id of the company this application SHOULD be
//                           part of.  Usually this is tied to the user
//                           creating the link, though a global admin could
//                           supply null here (no need to validate).
//
// Returns a promise that executes the update.
ApplicationNetworkTypeLink.prototype.pushApplicationNetworkTypeLink = function (applicationNetworkTypeLink, validateCompanyId) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      var rec = await me.impl.retrieveApplicationNetworkTypeLink(applicationNetworkTypeLink)

      // push devicenetworkTypeLinks
      let dntls = await modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks({ applicationId: rec.applicationId })
      let recs = dntls.records
      for (let i = 0; i < recs.length; ++i) {
        await modelAPI.deviceNetworkTypeLinks.pushDeviceNetworkTypeLink(recs[ i ].id)
      }

      var logs = await modelAPI.networkTypeAPI.pushApplication(rec.networkTypeId, rec.applicationId, rec.networkSettings)
      rec.remoteAccessLogs = logs
      resolve(rec)
    }
    catch (err) {
      appLogger.log('Error updating applicationNetworkTypeLink: ' + err)
      reject(err)
    }
  })
}

// Pull the companyNetworkTypeLinks record.
//
// companyNetworkTypeLinks - the record to be pushed.  Note that the id must be
//                           unchanged from retrieval to guarantee the same
//                           record is updated.
//
// Returns a promise that executes the update.
ApplicationNetworkTypeLink.prototype.pullApplicationNetworkTypeLink = function (networkTypeId) {
  return new Promise(async function (resolve, reject) {
    try {
      // var logs = await modelAPI.networkTypeAPI.pullCompany(networkTypeId);
      // let companies = JSON.parse(logs[Object.keys(logs)[0]].logs);
      // for (var index in companies.result) {
      //     let company = companies.result[index];
      //     //see if it exists first
      //     let existingCompany = await modelAPI.companies.retrieveCompanies({search: company.name});
      //     if (existingCompany.totalCount > 0) {
      //         appLogger.log(company.name + ' already exists');
      //     }
      //     else
      //         appLogger.log('creating ' + company.name);
      //         modelAPI.companies.createCompany(company.name, modelAPI.companies.COMPANY_VENDOR);
      //     }
      // }
      // modelAPI.applicationNetworkTypeLinks.pullApplicationNetworkTypeLink(networkTypeId)
      //     .then(function (ret) {
      //         restServer.respondJson(res, 200, ret);
      //     }).catch(function (err) {
      //     appLogger.log("Error pulling applications from network " + networkId + ": " + err);
      //     restServer.respond(res, err);
      // });

      resolve()
    }
    catch (err) {
      appLogger.log('Error pulling applications from Network : ' + networkTypeId + ' ' + err)
      reject(err)
    }
  })
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Retrieves a subset of the applicationNetworkTypeLinks in the system given the
// options.
//
// Options include limits on the number of applicationNetworkTypeLinks returned, the
// offset to the first applicationNetworkTypeLink returned (together giving a paging
// capability), the applicationId, and the networkTypeId.
//
// Returns a promise that does the retrieval.
ApplicationNetworkTypeLink.prototype.retrieveApplicationNetworkTypeLinks = function (options) {
  return this.impl.retrieveApplicationNetworkTypeLinks(options)
}

module.exports = ApplicationNetworkTypeLink
