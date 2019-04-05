const appLogger = require('../lib/appLogger.js')

// Configuration access.
const config = require('../config')

const DevNtwkTypeLink = require('./dao/production/deviceNetworkTypeLinks')

var modelAPI
var impl
//* *****************************************************************************
// The Device interface.
//* *****************************************************************************
// Class constructor.
//
// Loads the implementation for the device interface based on the passed
// subdirectory name.  The implementation file devices.js is to be found in
// that subdirectory of the models/dao directory (Data Access Object).
//
// implPath - The subdirectory to get the dao implementation from.
//
function Device (server) {
  this.impl = require('./dao/' +
                             config.get('impl_directory') +
                             '/devices.js')
  impl = this.impl
  modelAPI = server
};

// Retrieves a subset of the devices in the system given the options.
//
// Options include limits on the number of devices returned, the offset to
// the first device returned (together giving a paging capability), a
// search string on device name, an applicationId, and a deviceProfileId.
Device.prototype.retrieveDevices = function (options) {
  return this.impl.retrieveDevices(options)
}

// Retrieve an device record by id.
//
// id - the record id of the device.
//
// Returns a promise that executes the retrieval.
Device.prototype.retrieveDevice = async function retrieveDevice (id) {
  const dvc = await this.impl.retrieveDevice(id)
  try {
    const { records } = await DevNtwkTypeLink.retrieveDeviceNetworkTypeLinks({ deviceId: id })
    if (records.length) {
      dvc.networks = records.map(x => x.networkType.id)
    }
  }
  catch (err) {
    // ignore
  }
  return dvc
}

// Create the device record.
//
// name          - the name of the device
// description   - A description for the device
// deviceModel   - Model information for the device.
// applicationId - the id of the application this device belongs to
//
// Returns the promise that will execute the create.
Device.prototype.createDevice = function (name, description, applicationId, deviceModel) {
  appLogger.log(`IDevice ${name}, ${description}, ${applicationId}, ${deviceModel}`)
  return this.impl.createDevice(name, description, applicationId, deviceModel)
}

// Update the device record.
//
// device - the updated record.  Note that the id must be unchanged from
//          retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
Device.prototype.updateDevice = function (record) {
  return this.impl.updateDevice(record)
}

// Delete the device record.
//
// id - the id of the device record to delete.
//
// Returns a promise that performs the delete.
Device.prototype.deleteDevice = function (id) {
  let me = this
  return new Promise(async function (resolve, reject) {
    // Delete my deviceNetworkTypeLinks first.
    try {
      let dntls = await modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks(
        { deviceId: id })
      let recs = dntls.records
      for (let i = 0; i < recs.length; ++i) {
        await modelAPI.deviceNetworkTypeLinks.deleteDeviceNetworkTypeLink(
          recs[ i ].id)
      }
    }
    catch (err) {
      appLogger.log('Error deleting device-dependant networkTypeLinks: ',
        err)
    }

    try {
      await me.impl.deleteDevice(id)
      resolve()
    }
    catch (err) {
      reject(err)
    }
  })
}

// Since device access often depends on the user's company, we'll often have to
// do a check.  But this makes the code very convoluted with promises and
// callbacks.  Eaiser to do this as a validation step.
//
// If called, req.params.id MUST exist, and we assume this is an existing
// device id if this function is called.  We then use this to get the device
// and the device's application, and put them into the req object for use by
// the REST code.  This means that the REST code can easily check ownership,
// and it keeps all of that validation in one place, not requiring promises in
// some cases but not others (e.g., when the user is part of an admin company).
Device.prototype.fetchDeviceApplication = function (req, res, next) {
  impl.retrieveDevice(parseInt(req.params.id, 10))
    .then(function (dev) {
      // Save the device.
      req.device = dev
      modelAPI.applications.retrieveApplication(dev.application.id).then(function (app) {
        req.application = app
        next()
      })
        .catch(function (err) {
          if (err.status) {
            res.status(err.status)
          }
          else {
            res.status(400)
          }
          res.end()
        })
    })
    .catch(function (err) {
      if (err.status) {
        res.status(err.status)
      }
      else {
        res.status(400)
      }
      res.end()
    })
}

// This is similar to the previous method, except it looks for the
// applicationId in the request body to get the application for the device we
// want to create.
Device.prototype.fetchApplicationForNewDevice = function (req, res, next) {
  modelAPI.applications.retrieveApplication(parseInt(req.body.applicationId, 10))
    .then(function (app) {
      req.application = app
      next()
    })
    .catch(function (err) {
      res.status(400)
      res.end()
    })
}

module.exports = Device
