// General libraries in use in this module.
var appLogger = require('../lib/appLogger.js')

// Configuration access.
var nconf = require('nconf')

var modelAPI

//* *****************************************************************************
// The DeviceProfile interface.
//* *****************************************************************************
// Class constructor.
//
// Loads the implementation for the deviceProfile interface based on
// the configured subdirectory name.  The implementation file
// deviceProfile.js is to be found in that subdirectory of the
// models/dao directory (Data Access Object).
//
// server - The modelAPI object, allowing use of the other APIs.
//
function DeviceProfile (server) {
  this.impl = require('./dao/' +
                             nconf.get('impl_directory') +
                             '/deviceProfiles.js')

  modelAPI = server
}

// Create the deviceProfiles record.
//
// networkTypeId     - The id for the network the device is linked to
// companyId         - The id for the company that owns this profile.
// name              - The name of the device profile to present to the user for
//                     selection.
// description       - A description of the device profile.
// networkSettings   - The settings required by the network protocol in json
//                     format
//
// Returns the promise that will execute the create.
DeviceProfile.prototype.createDeviceProfile = function (networkTypeId, companyId, name, description, networkSettings) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      var rec = await me.impl.createDeviceProfile(networkTypeId, companyId, name, description, networkSettings)
      var logs = await modelAPI.networkTypeAPI.addDeviceProfile(networkTypeId, rec.id)
      rec.remoteAccessLogs = logs
      resolve(rec)
    }
    catch (err) {
      appLogger.log('Failed to create deviceProfile:' + err)
      reject(err)
    }
  })
}

DeviceProfile.prototype.createRemoteDeviceProfile = function (networkTypeId, companyId, name, description, networkSettings) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      var rec = await me.impl.createDeviceProfile(networkTypeId, companyId, name, description, networkSettings)
      resolve(rec)
    }
    catch (err) {
      appLogger.log('Failed to create deviceProfile:' + err)
      reject(err)
    }
  })
}

// Retrieve a deviceProfiles record by id.
//
// id - the record id of the deviceProfiles record.
//
// Returns a promise that executes the retrieval.
DeviceProfile.prototype.retrieveDeviceProfile = function (id) {
  return this.impl.retrieveDeviceProfile(id)
}

// Update the deviceProfiles record.
//
// deviceProfile - the updated record.  Note that the id must be
//                 unchanged from retrieval to guarantee the same
//                 record is updated.
//
// Returns a promise that executes the update.
DeviceProfile.prototype.updateDeviceProfile = function (deviceProfile) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      var rec = await me.impl.updateDeviceProfile(deviceProfile)
      var logs = await modelAPI.networkTypeAPI.pushDeviceProfile(rec.networkType.id, deviceProfile.id)
      rec.remoteAccessLogs = logs
      resolve(rec)
    }
    catch (err) {
      appLogger.log('Error updating deviceProfile:' + err)
      reject(err)
    };
  })
}

// Delete the deviceProfiles record.
//
// id                - the id of the deviceProfiles record to delete.
// validateCompanyId - The id of the company this device SHOULD be part of.
//                     Usually this is tied to the user creating the link,
//                     though a global admin could supply null here (no need to
//                     validate).
//
// Returns a promise that performs the delete.
DeviceProfile.prototype.deleteDeviceProfile = function (id, validateCompanyId) {
  var me = this
  var vci = validateCompanyId
  return new Promise(async function (resolve, reject) {
    try {
      // Since we clear the remote networks before we delete the local
      // record, validate the company now, if required.  Also, we need the
      // networkTypeId from the record to delete it from the relevant
      // networks.  So get the record to start anyway.
      var rec = await me.impl.retrieveDeviceProfile(id)

      if (vci && (vci !== null)) {
        if (vci !== rec.company.id) {
          reject(new httpError.Unauthorized())
          return
        }
      }

      // Don't delete the local record until the remote operations
      // complete.
      var logs = await modelAPI.networkTypeAPI.deleteDeviceProfile(rec.networkType.id, id)
      await me.impl.deleteDeviceProfile(id)
      resolve(logs)
    }
    catch (err) {
      appLogger.log('Error deleting deviceProfile: ' + err)
      reject(err)
    }
  })
}

// Update the deviceProfiles record.
//
// deviceProfile - the updated record.  Note that the id must be
//                 unchanged from retrieval to guarantee the same
//                 record is updated.
//
// Returns a promise that executes the update.
DeviceProfile.prototype.pushDeviceProfile = function (deviceProfile) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      var rec = await me.impl.retrieveDeviceProfile(deviceProfile)
      var logs = await modelAPI.networkTypeAPI.pushDeviceProfile(rec.networkType.id, deviceProfile.id)
      rec.remoteAccessLogs = logs
      resolve(rec)
    }
    catch (err) {
      appLogger.log('Error pushing deviceProfile:' + err)
      reject(err)
    };
  })
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Retrieves a subset of the deviceProfiles in the system given the
// options.
//
// Options the companyId and the networkTypeId.
//
// Returns a promise that does the retrieval.
DeviceProfile.prototype.retrieveDeviceProfiles = function (options) {
  return this.impl.retrieveDeviceProfiles(options)
}

module.exports = DeviceProfile
