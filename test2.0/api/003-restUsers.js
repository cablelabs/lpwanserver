var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var app = require('../../restApp.js')
var expect = chai.expect
var should = chai.should()

chai.use(chaiHttp)
var server = chai.request(app).keepOpen()

describe('Users', function () {
  var adminToken

  before('User Sessions', function (done) {
    var sessions = 0
    var waitFunc = function () {
      ++sessions
      if (sessions >= 1) {
        done()
      }
    }
    server
      .post('/api/sessions')
      .send({ 'login_username': 'admin', 'login_password': 'password' })
      .end(function (err, res) {
        if (err) return done(err)
        adminToken = res.text
        waitFunc()
      })
  })

  var userId1
  describe('POST /api/users', function () {
    it('should return 200 on admin', function (done) {
      server
        .post('/api/users')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'username': 'test1', 'password': 'test13', 'role': 'user', 'companyId': 1 })
        .end(function (err, res) {
          console.error(err)
          if (err) return done(err)
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          userId1 = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/users/' + userId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var userObj = JSON.parse(res.text)
          userObj.username.should.equal('test1')
          userObj.role.should.equal('user')
          done()
        })
    })
  })

  describe('GET /api/users (search/paging)', function () {
    it('should return 200 with 2 users on admin', function (done) {
      server
        .get('/api/users')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(2)
          result.totalCount.should.equal(2)
          done()
        })
    })

    it('should return 200 with 0 users on admin, limit 2, offset 4', function (done) {
      server
        .get('/api/users')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'limit': 2, 'offset': 4 })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          console.log(result)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(0)
          result.totalCount.should.equal(2)
          done()
        })
    })

    it('should return 200 with 2 users on admin, limit 2, offset 2', function (done) {
      server
        .get('/api/users')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'limit': 2, 'offset': 2 })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(0)
          result.totalCount.should.equal(2)
          done()
        })
    })

    it('should return 200 with 2 users on admin, search test%', function (done) {
      server
        .get('/api/users')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': 'test%' })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(1)
          result.totalCount.should.equal(1)
          done()
        })
    })
  })

  describe('GET /api/users/{id}', function () {
    it('should return 200 on admin', function (done) {
      server
        .get('/api/users/1')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/users/' + userId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var userObj = JSON.parse(res.text)
          userObj.username.should.equal('test1')
          userObj.role.should.equal('user')
          done()
        })
    })
  })

  describe('PUT /api/users', function () {
    it('should return 204 on admin', function (done) {
      server
        .put('/api/users/' + userId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send('{"username": "test1still" }')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(204)
          done()
        })
    })

    it('should return 204 on admin changing user\'s company', function (done) {
      server
        .put('/api/users/' + userId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send('{"companyId": 1 }')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(204)
          done()
        })
    })

    it('should return 200 on get with new user name', function (done) {
      server
        .get('/api/users/' + userId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var userObj = JSON.parse(res.text)
          userObj.username.should.equal('test1still')
          userObj.companyId.should.equal(1)
          done()
        })
    })
  })

  describe('GET /api/users/me', function () {
    it('should return 200 on admin', function (done) {
      server
        .get('/api/users/me')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var userObj = JSON.parse(res.text)
          userObj.username.should.equal('admin')
          userObj.company.id.should.equal(2)
          expect(userObj.passwordHash).to.not.exist
          expect(userObj.lastVerifiedEmail).to.not.exist
          done()
        })
    })
  })

  describe('DELETE /api/users', function () {
    it('should return 204 on admin', function (done) {
      server
        .delete('/api/users/' + userId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 on get', function (done) {
      server
        .get('/api/users/' + userId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(404)
          done()
        })
    })
  })
})
