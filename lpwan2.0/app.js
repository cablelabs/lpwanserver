'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const jwt = require('express-jwt')

const mongoose = require('mongoose')

const uri = 'mongodb://localhost/lpwanserver'
global.db = mongoose.createConnection(uri)
global.secret = 'changeme'
const routes = require('./routes/routes.js')
const app = express()

app.use(jwt({secret: global.secret}).unless({path: ['/users/login']}))
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('invalid token...')
  }
})
app.use(bodyParser.json())
app.use('/', routes)

app.listen(8000, function () {
  console.log('listening on http://localhost:8000')
})

module.exports = app
