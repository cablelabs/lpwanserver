'use strict'
const models = require('express').Router()
const reportingProtocols = require('../models/reporting-protocol')

models.get('/', reportingProtocols.get)
models.get('/:reportingProtocolId', reportingProtocols.getById)

module.exports = models
