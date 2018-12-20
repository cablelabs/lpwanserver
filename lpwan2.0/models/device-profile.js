'use strict'
const Schema = require('mongoose').Schema
const DeviceProfileSchema = Schema({
  classBTimeout: Number,
  classCTimeout: Number,
  factoryPresetFreqs: [
    Number
  ],
  id: String,
  macVersion: String,
  maxDutyCycle: Number,
  maxEIRP: Number,
  name: String,
  networkServerID: String,
  organizationID: String,
  pingSlotDR: Number,
  pingSlotFreq: Number,
  pingSlotPeriod: Number,
  regParamsRevision: String,
  rfRegion: String,
  rxDROffset1: Number,
  rxDataRate2: Number,
  rxDelay1: Number,
  rxFreq2: Number,
  supports32BitFCnt: Boolean,
  supportsClassB: Boolean,
  supportsClassC: Boolean,
  supportsJoin: Boolean
})

const RemoteDeviceProfileSchema = Schema({
  localId: String,
  remoteId: String,
  organizationID: String,
  serviceProfileID: String,
  key: String
})

/* global db */
module.exports.DeviceProfile = db.model('DeviceProfile', DeviceProfileSchema)
module.exports.RemoteDeviceProfile = db.model('RemoteDeviceProfile', RemoteDeviceProfileSchema)

module.exports.get = (req, res, next) => {
  this.DeviceProfile.find({}, (err, deviceProfiles) => {
    if (err) return next(err)
    res.send(deviceProfiles)
  })
}

module.exports.getById = (req, res, next) => {
  this.DeviceProfile.findById(req.params.deviceProfileId, (err, deviceProfile) => {
    if (err) return next(err)
    this.RemoteDeviceProfile.find({localId: deviceProfile.id}, (err, remotes) => {
      if (err) return next(err)
      deviceProfile.remoteAppliations = remotes
      res.send(deviceProfile)
    })
  })
}

module.exports.post = (req, res, next) => {
  this.DeviceProfile.create(req.body, (err, deviceProfile) => {
    if (err) return next(err)
    res.send(deviceProfile)
  })
}

module.exports.postRemote = (req, res, next) => {
  this.RemoteDeviceProfile.create(req.body, (err, deviceProfile) => {
    if (err) return next(err)
    res.send(deviceProfile)
  })
}


