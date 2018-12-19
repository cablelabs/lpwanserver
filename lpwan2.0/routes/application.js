'use strict'
const models = require('express').Router()
const applications = require('../models/application')
const device = require('../models/device')

models.get('/', applications.get)
models.get('/:applicationId', applications.getById)
models.get('/:applicationId/devices', device.getByApplicationId)
models.post('/', applications.post)

module.exports = models
