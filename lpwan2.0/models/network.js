'use strict'
const Schema = require('mongoose').Schema
const ObjectId = Schema.ObjectId

const NetworkSchema = Schema({
  networkTypeId: ObjectId,
  networkProtocolId: ObjectId,
  credentials: Object,
  baseUrl: String,
  name: String,
  authorized: {type: Boolean, default: false},
  enabled: {type: Boolean, default: true}
})

/* global db */
module.exports.NetworkModel = db.model('Network', NetworkSchema)

module.exports.get = (req, res, next) => {
  this.NetworkModel.find({}, (err, networks) => {
    if (err) return next(err)
    res.send(networks)
  })
}

module.exports.getById = (req, res, next) => {
  this.NetworkModel.findById(req.params.networkId, (err, network) => {
    if (err) return next(err)
    res.send(network)
  })
}

module.exports.post = (req, res, next) => {
  this.NetworkModel.create(req.body, (err, network) => {
    if (err) return next(err)
    // TODO: Push and Pull occurs here
    /**
     * Steps
     * 1 Login & Test using Protocol Handler
     * 2 Pull Network using Protocol Handler (normalize data)
     * 3 Push to all other networks
     * 4 Push to this network
     * 5 Save everything
     */
    network.save(function (err, finalNetwork) {
      if (err) return next(err)
      res.send(finalNetwork)
    })
  })
}

module.exports.put = (req, res, next) => {
  this.NetworkModel.findById(req.params.networkId, (err, network) => {
    if (err) return next(err)
    for (let prop in req.body) {
      network[prop] = req.body[prop]
    }
    network.authorized = false
    // TODO: Push and Pull occurs here
    /**
     * Steps
     * 1 Login & Test using Protocol Handler
     * 2 Pull Network using Protocol Handler (normalize data)
     * 3 Push to all other networks
     * 4 Push to this network
     * 5 Save everything
     */
    network.save(function (err, finalNetwork) {
      if (err) return next(err)
      res.send(finalNetwork)
    })
  })
}
