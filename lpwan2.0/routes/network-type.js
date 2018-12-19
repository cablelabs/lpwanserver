'use strict'
const models = require('express').Router()
const networkTypes = require('../models/network-type')

models.get('/', networkTypes.get)
models.get('/:networkTypeId', networkTypes.getById)

module.exports = models
