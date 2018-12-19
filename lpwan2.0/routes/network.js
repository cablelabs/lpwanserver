'use strict'
const models = require('express').Router()
const networks = require('../models/network')

models.get('/', networks.get)
models.get('/:networkId', networks.getById)
models.post('/', networks.post)

module.exports = models
