// General libraries in use in this module.
var appLogger = require('../lib/appLogger.js')

// Configuration access.
var nconf = require('nconf')

var modelAPI

//* *****************************************************************************
// The DeviceNetworkTypeLink interface.
//* *****************************************************************************
// Class constructor.
//
// Loads the implementation for the deviceNetworkTypeLink interface based on
// the configured subdirectory name.  The implementation file
// deviceNetworkTypeLink.js is to be found in that subdirectory of the
// models/dao directory (Data Access Object).
//
// server - The modelAPI object, allowing use of the other APIs.
//
function DeviceNetworkTypeLink (server) {
  this.impl = new require('./dao/' +
                             nconf.get('impl_directory') +
                             '/deviceNetworkTypeLinks.js')

  modelAPI = server
}

// Create the deviceNetworkTypeLinks record.
//
// deviceId          - The id for the device this link is being created for
// networkTypeId     - The id for the network the device is linked to
// deviceProfileId   - The id for the deviceProfile this device uses on the
//                     networkType.
// networkSettings   - The settings required or allowed by the network protocol
//                     in json format
// validateCompanyId - The id of the company this device SHOULD be part of.
//                     Usually this is tied to the user creating the link,
//                     though a global admin could supply null here.
//
// Returns the promise that will execute the create.
DeviceNetworkTypeLink.prototype.createDeviceNetworkTypeLink = function (deviceId, networkTypeId, deviceProfileId, networkSettings, validateCompanyId) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      var rec = await me.impl.createDeviceNetworkTypeLink(deviceId, networkTypeId, deviceProfileId, networkSettings, validateCompanyId)
      var logs = await modelAPI.networkTypeAPI.addDevice(networkTypeId, deviceId, networkSettings)
      rec.remoteAccessLogs = logs
      resolve(rec)
    }
    catch (err) {
      appLogger.log('Error creating deviceNetworkTypeLink: ' + err)
      reject(err)
    }
  })
}

DeviceNetworkTypeLink.prototype.createRemoteDeviceNetworkTypeLink = function (deviceId, networkTypeId, deviceProfileId, networkSettings, validateCompanyId) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      var rec = await me.impl.createDeviceNetworkTypeLink(deviceId, networkTypeId, deviceProfileId, networkSettings, validateCompanyId)
      resolve(rec)
    }
    catch (err) {
      appLogger.log('Error creating deviceNetworkTypeLink: ' + err)
      reject(err)
    }
  })
}

// Retrieve a deviceNetworkTypeLinks record by id.
//
// id - the record id of the deviceNetworkTypeLinks record.
//
// Returns a promise that executes the retrieval.
DeviceNetworkTypeLink.prototype.retrieveDeviceNetworkTypeLink = function (id) {
  return this.impl.retrieveDeviceNetworkTypeLink(id)
}

// Update the deviceNetworkTypeLinks record.
//
// deviceNetworkTypeLinks - the updated record.  Note that the id must be
//                      unchanged from retrieval to guarantee the same
//                      record is updated.
// validateCompanyId  - The id of the company this device SHOULD be
//                      part of.  Usually this is tied to the user
//                      creating the link, though a global admin could
//                      supply null here (no need to validate).
//
// Returns a promise that executes the update.
DeviceNetworkTypeLink.prototype.updateDeviceNetworkTypeLink = function (deviceNetworkTypeLink, validateCompanyId) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      var rec = await me.impl.updateDeviceNetworkTypeLink(deviceNetworkTypeLink, validateCompanyId)
      var logs = await modelAPI.networkTypeAPI.pushDevice(rec.networkTypeId, rec, rec.networkSettings)
      rec.remoteAccessLogs = logs
      resolve(rec)
    }
    catch (err) {
      appLogger.log('Error updating deviceNetworkTypeLink: ' + err)
      reject(err)
    }
  })
}

// Update the deviceNetworkTypeLinks record.
//
// deviceNetworkTypeLinks - the updated record.  Note that the id must be
//                      unchanged from retrieval to guarantee the same
//                      record is updated.
// validateCompanyId  - The id of the company this device SHOULD be
//                      part of.  Usually this is tied to the user
//                      creating the link, though a global admin could
//                      supply null here (no need to validate).
//
// Returns a promise that executes the update.
DeviceNetworkTypeLink.prototype.pushDeviceNetworkTypeLink = function (deviceNetworkTypeLink, validateCompanyId) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      var rec = await me.impl.retrieveDeviceNetworkTypeLink(deviceNetworkTypeLink)
      var logs = await modelAPI.networkTypeAPI.pushDevice(rec.networkTypeId, rec.deviceId, rec.networkSettings)
      rec.remoteAccessLogs = logs
      resolve(rec)
    }
    catch (err) {
      appLogger.log('Error updating deviceNetworkTypeLink: ' + err)
      reject(err)
    }
  })
}

// Delete the deviceNetworkTypeLinks record.
//
// id                - the id of the deviceNetworkTypeLinks record to delete.
// validateCompanyId - The id of the company this device SHOULD be part of.
//                     Usually this is tied to the user creating the link,
//                     though a global admin could supply null here (no need to
//                     validate).
//
// Returns a promise that performs the delete.
DeviceNetworkTypeLink.prototype.deleteDeviceNetworkTypeLink = function (id, validateCompanyId) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      var rec = await me.impl.retrieveDeviceNetworkTypeLink(id)
      // Since we clear the remote networks before we delete the local
      // record, validate the company now, if required.
      if (validateCompanyId) {
        var dev = await modelAPI.devices.retrieveDevice(rec.deviceId)
        var app = await modelAPI.applications.retrieveApplication(dev.applicationId)
        if (validateCompanyId != app.companyId) {
          reject(new httpError.Unauthorized())
          return
        }
      }
      // Don't delete the local record until the remote operations complete.
      var logs = await modelAPI.networkTypeAPI.deleteDevice(rec.networkTypeId, rec.deviceId)
      await me.impl.deleteDeviceNetworkTypeLink(id)
      resolve(logs)
    }
    catch (err) {
      appLogger.log('Error deleting deviceNetworkTypeLink: ' + err)
      reject(err)
    }
  })
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Retrieves a subset of the deviceNetworkTypeLinks in the system given the
// options.
//
// Options include limits on the number of deviceNetworkTypeLinks returned, the
// offset to the first deviceNetworkTypeLink returned (together giving a paging
// capability), the deviceId, and the networkTypeId.
//
// Returns a promise that does the retrieval.
DeviceNetworkTypeLink.prototype.retrieveDeviceNetworkTypeLinks = function (options) {
  return this.impl.retrieveDeviceNetworkTypeLinks(options)
}

module.exports = DeviceNetworkTypeLink
