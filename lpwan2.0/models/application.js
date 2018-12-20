'use strict'
const Schema = require('mongoose').Schema

const ApplicationSchema = Schema({
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
module.exports.ApplicationModel = db.model('Application', ApplicationSchema)
module.exports.RemoteApplicationModel = db.model('RemoteApplication', RemoteApplicationSchema)

module.exports.get = (req, res, next) => {
  this.ApplicationModel.find({}, (err, applications) => {
    if (err) return next(err)
    res.send(applications)
  })
}

module.exports.getById = (req, res, next) => {
  this.ApplicationModel.findById(req.params.applicationId, (err, application) => {
    if (err) return next(err)
    this.RemoteApplicationModel.find({localId: application.id}, (err, remotes) => {
      if (err) return next(err)
      application.remoteAppliations = remotes
      res.send(application)
    })
  })
}

module.exports.post = (req, res, next) => {
  this.ApplicationModel.create(req.body, (err, application) => {
    if (err) return next(err)
    res.send(application)
  })
}

module.exports.postRemote = (req, res, next) => {
  this.RemoteApplicationModel.create(req.body, (err, application) => {
    if (err) return next(err)
    res.send(application)
  })
}
