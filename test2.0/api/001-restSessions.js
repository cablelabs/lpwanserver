var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var app = require('../../restApp.js')
var should = chai.should()

chai.use(chaiHttp)
var server = chai.request(app).keepOpen()

describe('Sessions', function () {
  var userToken

  describe('POST /api/sessions', function () {
    it('should return 401 when the login is not valid', function (done) {
      server
        .post('/api/sessions')
        .send({ 'login_username': 'foo', 'login_password': 'bar' })
        .end(function (err, res) {
          res.should.have.status(401)
          done()
        })
    })

    it('should return 200 and a jwt when the login is valid', function (done) {
      server
        .post('/api/sessions')
        .send({ 'login_username': 'clAdmin', 'login_password': 'password' })
        .end(function (err, res) {
          res.should.have.status(200)
          userToken = res.text
          done()
        })
    })

    it('should be able to use the coAdmin jwt to get all companies', function (done) {
      server
        .get('/api/companies')
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          done()
        })
    })
  })

  describe('DELETE /api/sessions', function () {
    it('should return 401 with no token', function (done) {
      server
        .delete('/api/sessions')
        .end(function (err, res) {
          res.should.have.status(401)
          done()
        })
    })

    it('should return 204 when the login is valid', function (done) {
      server
        .delete('/api/sessions')
        .set('Authorization', 'Bearer ' + userToken)
        .end(function (err, res) {
          res.should.have.status(204)
          userToken = {}
          done()
        })
    })
  })
})
