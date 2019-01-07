var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var app = require('../../restApp.js')
var should = chai.should()

chai.use(chaiHttp)
var server = chai.request(app).keepOpen()

describe('Sessions', function () {
  var adminToken
  before((done) => {
    setTimeout(done, 2000)
  })

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
        .send({ 'login_username': 'admin', 'login_password': 'password' })
        .end(function (err, res) {
          res.should.have.status(200)
          adminToken = res.text
          done()
        })
    })

    it('should be able to use the admin jwt to get all companies', function (done) {
      server
        .get('/api/companies')
        .set('Authorization', 'Bearer ' + adminToken)
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
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          res.should.have.status(204)
          adminToken = {}
          done()
        })
    })
  })
})
