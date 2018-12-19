'use strict'
const Schema = require('mongoose').Schema

const ReportingProtocolSchema = Schema({
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
  reportingProtocolEUI: String,
  key: String
})

/* global db */
module.exports.ReportingProtocolModel = db.model('ReportingProtocol', ReportingProtocolSchema)

module.exports.get = (req, res, next) => {
  this.ReportingProtocolModel.find({}, (err, reportingProtocols) => {
    if (err) next(err)
    res.send(reportingProtocols)
  })
}

module.exports.getById = (req, res, next) => {
  this.ReportingProtocolModel.findById(req.params.reportingProtocolId, (err, reportingProtocol) => {
    if (err) next(err)
    res.send(reportingProtocol)
  })
}

