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
  var coAdminToken
  var userToken

  before('User Sessions', function (done) {
    var sessions = 0
    var waitFunc = function () {
      ++sessions
      if (sessions >= 3) {
        done()
      }
    }
    server
      .post('/api/sessions')
      .send({ 'login_username': 'admin', 'login_password': 'password' })
      .end(function (err, res) {
        if (err) {
          return done(err)
        }
        adminToken = res.text
        waitFunc()
      })

    server
      .post('/api/sessions')
      .send({ 'login_username': 'clAdmin', 'login_password': 'password' })
      .end(function (err, res) {
        if (err) {
          return done(err)
        }
        coAdminToken = res.text
        waitFunc()
      })

    server
      .post('/api/sessions')
      .send({ 'login_username': 'clUser', 'login_password': 'password' })
      .end(function (err, res) {
        if (err) {
          return done(err)
        }
        userToken = res.text
        waitFunc()
      })
  })

  var userId1
  var userId3
  describe('POST /api/users', function () {
    it('should return 200 on coAdmin', function (done) {
      server
        .post('/api/users')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .send({ 'username': 'test1', 'password': 'test11', 'role': 'user', 'companyId': 2 })
        .end(function (err, res) {
          console.log(res.text)
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          userId1 = ret.id
          done()
        })
    })

    it('should return 403 (forbidden) on user', function (done) {
      server
        .post('/api/users')
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .send({ 'username': 'test2', 'password': 'test22', 'role': 'user', 'companyId': 2 })
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .post('/api/users')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'username': 'test3', 'password': 'test33', 'role': 'user', 'companyId': 2 })
        .end(function (err, res) {
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          userId3 = ret.id
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
          res.should.have.status(200)
          var userObj = JSON.parse(res.text)
          userObj.username.should.equal('test1')
          userObj.role.should.equal('user')
          done()
        })
    })
  })

  describe('GET /api/users (search/paging)', function () {
    it('should return 200 with 3 users on coAdmin', function (done) {
      server
        .get('/api/users')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(4)
          result.totalCount.should.equal(4)
          done()
        })
    })

    it('should return 403 (forbidden) on user', function (done) {
      server
        .get('/api/users')
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 with 5 users on admin', function (done) {
      server
        .get('/api/users')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(5)
          result.totalCount.should.equal(5)
          done()
        })
    })

    it('should return 200 with 1 user on admin, limit 2, offset 4', function (done) {
      server
        .get('/api/users')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'limit': 2, 'offset': 4 })
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(1)
          result.totalCount.should.equal(5)
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
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(2)
          result.totalCount.should.equal(5)
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
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(2)
          result.totalCount.should.equal(2)
          done()
        })
    })

    it('should return 200 with 1 user on admin, search cla%', function (done) {
      server
        .get('/api/users')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': 'cla%' })
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(1)
          result.totalCount.should.equal(1)
          done()
        })
    })

    it('should return 200 with 2 users on coAdmin, search cl%', function (done) {
      server
        .get('/api/users')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': 'cl%' })
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(2)
          result.totalCount.should.equal(2)
          done()
        })
    })
  })

  describe('GET /api/users/{id}', function () {
    it('should return 403 (forbidden) on coAdmin - not my company', function (done) {
      server
        .get('/api/users/1')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 403 (forbidden) on user - not my company', function (done) {
      server
        .get('/api/users/1')
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .get('/api/users/1')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/users/' + userId3)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var userObj = JSON.parse(res.text)
          userObj.username.should.equal('test3')
          userObj.role.should.equal('user')
          done()
        })
    })

    it('should return 200 on coAdmin getting user', function (done) {
      server
        .get('/api/users/' + userId3)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on user getting me', function (done) {
      server
        .get('/api/users/3')
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })
  })

  describe('PUT /api/users', function () {
    it('should return 403 (forbidden) on coAdmin - not my company\'s user', function (done) {
      server
        .put('/api/users/1')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .send('{"username": "administrator" }')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 403 (forbidden) on user - not me', function (done) {
      server
        .put('/api/users/' + userId1)
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .send('{"username": "notmesir" }')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 204 on admin', function (done) {
      server
        .put('/api/users/' + userId3)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send('{"username": "test3still" }')
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 403 (forbidden) on coAdmin changing company', function (done) {
      server
        .put('/api/users/' + userId3)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .send('{"companyId": 1 }')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 403 (forbidden) on user changing role', function (done) {
      server
        .put('/api/users/' + userId1)
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .send('{"role": "admin" }')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 204 on coAdmin changing role', function (done) {
      server
        .put('/api/users/' + userId1)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .send('{"role": "admin", "email": "test@fakeurl.com" }')
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 204 on admin changing user\'s company', function (done) {
      server
        .put('/api/users/' + userId3)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send('{"companyId": 1 }')
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 200 on get with new user name', function (done) {
      server
        .get('/api/users/' + userId3)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var userObj = JSON.parse(res.text)
          userObj.username.should.equal('test3still')
          userObj.companyId.should.equal(1)
          done()
        })
    })
  })

  describe('GET /api/users/me', function () {
    it('should return 200 on user', function (done) {
      server
        .get('/api/users/me')
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var userObj = JSON.parse(res.text)
          userObj.username.should.equal('cluser')
          userObj.companyId.should.equal(2)
          userObj.role.should.equal('user')
          expect(userObj.passwordHash).to.not.exist
          expect(userObj.lastVerifiedEmail).to.not.exist
          done()
        })
    })

    it('should return 200 on coAdmin', function (done) {
      server
        .get('/api/users/me')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var userObj = JSON.parse(res.text)
          userObj.username.should.equal('cladmin')
          userObj.companyId.should.equal(2)
          userObj.role.should.equal('admin')
          expect(userObj.passwordHash).to.not.exist
          expect(userObj.lastVerifiedEmail).to.not.exist
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .get('/api/users/me')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var userObj = JSON.parse(res.text)
          userObj.username.should.equal('admin')
          userObj.companyId.should.equal(1)
          expect(userObj.passwordHash).to.not.exist
          expect(userObj.lastVerifiedEmail).to.not.exist
          done()
        })
    })
  })

  describe('DELETE /api/users', function () {
    it('should return 204 on coAdmin', function (done) {
      server
        .delete('/api/users/' + userId1)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 403 (forbidden) on user', function (done) {
      server
        .delete('/api/users/' + userId3)
        .set('Authorization', 'Bearer ' + userToken)
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 204 on admin', function (done) {
      server
        .delete('/api/users/' + userId3)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 on get', function (done) {
      server
        .get('/api/users/' + userId3)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(404)
          done()
        })
    })
  })
})
