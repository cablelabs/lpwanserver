'use strict'
const Schema = require('mongoose').Schema
const ApplicationSchema = Schema({
  baseUrl: String,
  reportingProtocolId: String,
  description: String,
  id: String,
  name: String,
  organizationID: String,
  payloadCodec: String,
  payloadDecoderScript: String,
  payloadEncoderScript: String,
  validationScript: String,
  serviceProfileID: String,
  cansend: Boolean,
  deviceLimit: Number,
  devices: Number,
  overbosity: String,
  ogwinfo: String,
  orx: Boolean,
  canotaa: Boolean,
  suspended: Boolean,
  clientsLimit: Number,
  joinServer: Object,
  applicationEUI: String,
  key: String
})

const RemoteApplicationSchema = Schema({
  localId: String,
  remoteId: String,
  organizationID: String,
  serviceProfileID: String,
  key: String
})

/* global db */
module.exports.Application = db.model('Application', ApplicationSchema)
module.exports.RemoteApplication = db.model('RemoteApplication', RemoteApplicationSchema)

module.exports.get = (req, res, next) => {
  this.Application.find({}, (err, applications) => {
    if (err) next(err)
    res.send(applications)
  })
}

module.exports.getById = (req, res, next) => {
  this.Application.findById(req.params.applicationId, (err, application) => {
    if (err) next(err)
    this.RemoteApplication.find({localId: application.id}, (err, remotes) => {
      if (err) next(err)
      application.remoteAppliations = remotes
      res.send(application)
    })
  })
}

module.exports.post = (req, res, next) => {
  this.Application.create(req.body, (err, application) => {
    if (err) next(err)
    res.send(application)
  })
}

module.exports.postRemote = (req, res, next) => {
  this.RemoteApplication.create(req.body, (err, application) => {
    if (err) next(err)
    res.send(application)
  })
}


