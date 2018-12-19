'use strict'
const Schema = require('mongoose').Schema
const DeviceProfileSchema = Schema({
  baseUrl: String,
  reportingProtocolId: String,
  description: String,
  name: String,
  organizationID: String,
  payloadCodec: String,
  payloadDecoderScript: String,
  payloadEncoderScript: String,
  validationScript: String,
  serviceProfileID: String,
  deviceProfileEUI: String,
  key: String
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
    if (err) next(err)
    res.send(deviceProfiles)
  })
}

module.exports.getById = (req, res, next) => {
  this.DeviceProfile.findById(req.params.deviceProfileId, (err, deviceProfile) => {
    if (err) next(err)
    this.RemoteDeviceProfile.find({localId: deviceProfile.id}, (err, remotes) => {
      if (err) next(err)
      deviceProfile.remoteAppliations = remotes
      res.send(deviceProfile)
    })
  })
}

module.exports.post = (req, res, next) => {
  this.DeviceProfile.create(req.body, (err, deviceProfile) => {
    if (err) next(err)
    res.send(deviceProfile)
  })
}

module.exports.postRemote = (req, res, next) => {
  this.RemoteDeviceProfile.create(req.body, (err, deviceProfile) => {
    if (err) next(err)
    res.send(deviceProfile)
  })
}


