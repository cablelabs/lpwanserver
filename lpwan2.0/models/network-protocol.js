'use strict'
const Schema = require('mongoose').Schema

const NetworkProtocolSchema = Schema({
  name: String,
  handler: String,
  version: String
})

/* global db */
module.exports.NetworkProtocolModel = db.model('NetworkProtocol', NetworkProtocolSchema)

module.exports.get = (req, res, next) => {
  this.NetworkProtocolModel.find({}, (err, networkProtocols) => {
    if (err) return next(err)
    res.send(networkProtocols)
  })
}

module.exports.getById = (req, res, next) => {
  this.NetworkProtocolModel.findById(req.params.networkProtocolId, (err, networkProtocol) => {
    if (err) return next(err)
    res.send(networkProtocol)
  })
}

