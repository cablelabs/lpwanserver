'use strict'
const Schema = require('mongoose').Schema
const ObjectId = Schema.ObjectId

const NetworkSchema = Schema({
  networkTypeId: ObjectId,
  networkProtocolId: ObjectId,
  credentials: Object,
  baseUrl: String,
  name: String,
  authorized: Boolean,
  enabled: Boolean
})

/* global db */
module.exports.NetworkModel = db.model('Network', NetworkSchema)

module.exports.get = (req, res, next) => {
  this.NetworkModel.find({}, (err, networks) => {
    if (err) next(err)
    res.send(networks)
  })
}

module.exports.getById = (req, res, next) => {
  this.NetworkModel.findById(req.params.networkId, (err, network) => {
    if (err) next(err)
    res.send(network)
  })
}

module.exports.post = (req, res, next) => {
  this.NetworkModel.create(req.body, (err, network) => {
    if (err) next(err)
    //TODO: Push and Pull occurs here
    res.send(network)
  })
}
