'use strict'
const Schema = require('mongoose').Schema

const CredentialSchema = Schema({
  name: {type: String, default: 'LoraV1Credentials'},
  username: String,
  password: String,
  token: String,
  refreshToken: String,
  expires: Date
})

module.exports.CredentialModel = db.model('Credentials', CredentialSchema)


