'use strict'
const express = require('express')
const bodyParser = require('body-parser');

const mongoose = require('mongoose')

const uri = 'mongodb://localhost/lpwanserver'
global.db = mongoose.createConnection(uri)

const routes = require('./routes/routes.js')
const app = express()

app.use(bodyParser.json())
app.use('/', routes)

app.listen(8000, function () {
  console.log('listening on http://localhost:8000')
})

module.exports = app
