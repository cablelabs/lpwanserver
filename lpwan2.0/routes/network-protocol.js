'use strict'
const models = require('express').Router()
const networkProtocols = require('../models/network-protocol')

models.get('/', networkProtocols.get)
models.get('/:networkProtocolId', networkProtocols.getById)

module.exports = models
