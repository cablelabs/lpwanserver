'use strict'
const models = require('express').Router()
const applications = require('../models/application')

models.get('/', applications.get)
models.get('/:applicationId', applications.getById)
models.post('/', applications.post)

module.exports = models
