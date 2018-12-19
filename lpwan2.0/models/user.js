'use strict'
const jwt = require('jsonwebtoken')
const Schema = require('mongoose').Schema
const UserSchema = Schema({
  username: String,
  password: String,
  email: String,
  firstName: String,
  lastName: String
})

/* global db */
module.exports.User = db.model('User', UserSchema)

module.exports.login = (req, res, next) => {
  if (!req.body.username || !req.body.password) {
    next(new Error('Bad Request'))
  }
  else {
    this.User.find({username: req.body.username}, (err, users) => {
      if (err) next(new Error('User not found'))
      else if (users.length === 0) next(new Error('User not found'))
      let user = users[0]
      // TODO: validate user ...
      let token = jwt.sign({user: user.username}, global.secret, {})
      res.send(token)
    })
  }
}

module.exports.get = (req, res, next) => {
  this.User.find({}, (err, users) => {
    if (err) next(err)
    res.send(users)
  })
}

module.exports.getById = (req, res, next) => {
  this.User.findById(req.params.userId, (err, user) => {
    if (err) next(err)
    this.RemoteUser.find({localId: user.id}, (err, remotes) => {
      if (err) next(err)
      user.remoteAppliations = remotes
      res.send(user)
    })
  })
}

module.exports.post = (req, res, next) => {
  this.User.create(req.body, (err, user) => {
    if (err) next(err)
    res.send(user)
  })
}
