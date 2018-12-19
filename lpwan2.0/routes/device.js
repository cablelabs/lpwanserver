'use strict'
const models = require('express').Router()
const devices = require('../models/device')

models.get('/', devices.get)
models.get('/:deviceId', devices.getById)
models.post('/', devices.post)

module.exports = models
