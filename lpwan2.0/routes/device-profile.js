'use strict'
const models = require('express').Router()
const deviceProfiles = require('../models/device-profile')

models.get('/', deviceProfiles.get)
models.get('/:deviceProfileId', deviceProfiles.getById)
models.post('/', deviceProfiles.post)

module.exports = models
