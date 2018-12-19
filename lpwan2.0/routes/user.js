'use strict'
const models = require('express').Router()
const users = require('../models/user')

models.get('/', users.get)
models.get('/:userId', users.getById)
models.post('/', users.post)
models.post('/login', users.login)

module.exports = models
