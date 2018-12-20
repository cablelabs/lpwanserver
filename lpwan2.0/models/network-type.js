'use strict'
const Schema = require('mongoose').Schema

const NetworkTypeSchema = Schema({
  name: String,
  handler: String
})

/* global db */
module.exports.NetworkTypeModel = db.model('NetworkType', NetworkTypeSchema)

module.exports.get = (req, res, next) => {
  this.NetworkTypeModel.find({}, (err, networkTypes) => {
    if (err) return next(err)
    res.send(networkTypes)
  })
}

module.exports.getById = (req, res, next) => {
  this.NetworkTypeModel.findById(req.params.networkTypeId, (err, networkType) => {
    if (err) return next(err)
    res.send(networkType)
  })
}

