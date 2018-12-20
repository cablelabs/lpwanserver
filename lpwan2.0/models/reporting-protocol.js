'use strict'
const Schema = require('mongoose').Schema

const ReportingProtocolSchema = Schema({
  name: String,
  handler: String,
  version: String
})

/* global db */
module.exports.ReportingProtocolModel = db.model('ReportingProtocol', ReportingProtocolSchema)

module.exports.get = (req, res, next) => {
  this.ReportingProtocolModel.find({}, (err, reportingProtocols) => {
    if (err) return next(err)
    res.send(reportingProtocols)
  })
}

module.exports.getById = (req, res, next) => {
  this.ReportingProtocolModel.findById(req.params.reportingProtocolId, (err, reportingProtocol) => {
    if (err) return next(err)
    res.send(reportingProtocol)
  })
}

