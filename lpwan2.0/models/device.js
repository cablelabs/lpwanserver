'use strict'
const Schema = require('mongoose').Schema

const DeviceSchema = Schema({
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
  deviceEUI: String,
  key: String
})

const RemoteDeviceSchema = Schema({
  localId: String,
  remoteId: String,
  organizationID: String,
  serviceProfileID: String,
  key: String
})

/* global db */
module.exports.DeviceModel = db.model('Device', DeviceSchema)
module.exports.RemoteDeviceModel = db.model('RemoteDevice', RemoteDeviceSchema)

module.exports.get = (req, res, next) => {
  this.DeviceModel.find({}, (err, devices) => {
    if (err) next(err)
    res.send(devices)
  })
}

module.exports.getById = (req, res, next) => {
  this.DeviceModel.findById(req.params.deviceId, (err, device) => {
    if (err) next(err)
    this.RemoteDeviceModel.find({localId: device.id}, (err, remotes) => {
      if (err) next(err)
      device.remoteAppliations = remotes
      res.send(device)
    })
  })
}

module.exports.getByApplicationId = (req, res, next) => {
  this.DeviceModel.find({applicationId: req.params.applicationId}, (err, devices) => {
    if (err) next(err)
    let promiseList = []
    for (let index = 0; index < devices.length; index++) {
      promiseList.put(this.getRemoteDevicesByDeviceId(devices[index]))
    }
    Promise.all(promiseList)
      .then(devices => {
        res.send(devices)
      })
      .catch(err => {
        console.log(err)
        next(err)
      })
  })
}

module.exports.getRemoteDevicesByDeviceId = async (device) => {
  this.RemoteDeviceModel.find({localId: device}, (err, remotes) => {
    if (err) throw (err)
    device.remoteDevices = remotes
    return (device)
  })
}

module.exports.post = (req, res, next) => {
  this.DeviceModel.create(req.body, (err, device) => {
    if (err) next(err)
    res.send(device)
  })
}

module.exports.postRemote = (req, res, next) => {
  this.RemoteDeviceModel.create(req.body, (err, device) => {
    if (err) next(err)
    res.send(device)
  })
}
