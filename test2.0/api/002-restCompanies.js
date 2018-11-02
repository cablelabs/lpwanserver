var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var app = require('../../restApp.js')
var should = chai.should()

chai.use(chaiHttp)
var server = chai.request(app).keepOpen()

describe('Companies', function () {
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

  var coId
  describe('POST /api/companies', function () {
    it('should return 403 (forbidden) on coAdmin', function (done) {
      server
        .post('/api/companies')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .send({ 'name': 'DeviceGuys', 'type': 'devicemfg' })
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 403 (forbidden) on user', function (done) {
      server
        .post('/api/companies')
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .send({ 'name': 'DeviceGuys', 'type': 'devicemfg' })
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .post('/api/companies')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'name': 'DeviceGuys', 'type': 'devicemfg' })
        .end(function (err, res) {
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          coId = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/companies/' + coId)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var coObj = JSON.parse(res.text)
          coObj.name.should.equal('DeviceGuys')
          coObj.type.should.equal('devicemfg')
          done()
        })
    })
  })

  describe('GET /api/companies (search/paging)', function () {
    it('should return 200 with 1 company on coAdmin', function (done) {
      server
        .get('/api/companies')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(1)
          result.totalCount.should.equal(1)
          done()
        })
    })

    it('should return 403 (forbidden) on user', function (done) {
      server
        .get('/api/companies')
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 with 3 companies on admin', function (done) {
      server
        .get('/api/companies')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(3)
          result.totalCount.should.equal(3)
          done()
        })
    })

    it('should return 200 with 1 company on admin, limit 2, offset 2', function (done) {
      server
        .get('/api/companies')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'limit': 2, 'offset': 2 })
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(1)
          result.totalCount.should.equal(3)
          done()
        })
    })

    it('should return 200 with 1 company on admin, search Device%', function (done) {
      server
        .get('/api/companies')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': 'Device%' })
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(1)
          result.totalCount.should.equal(1)
          done()
        })
    })

    it('should return 200 with 2 companies on admin, search c%', function (done) {
      server
        .get('/api/companies')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': 'c%' })
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(2)
          result.totalCount.should.equal(2)
          done()
        })
    })

    it('should return 200 with 1 company on coAdmin, search c%', function (done) {
      server
        .get('/api/companies')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': 'c%' })
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(1)
          result.totalCount.should.equal(1)
          done()
        })
    })
  })

  describe('GET /api/companies/{id}', function () {
    it('should return 403 (forbidden) on coAdmin - not my company', function (done) {
      server
        .get('/api/companies/' + coId)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 403 (forbidden) on user - not my company', function (done) {
      server
        .get('/api/companies/' + coId)
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .get('/api/companies/' + coId)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          coId = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/companies/' + coId)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var coObj = JSON.parse(res.text)
          coObj.name.should.equal('DeviceGuys')
          coObj.type.should.equal('devicemfg')
          done()
        })
    })

    it('should return 200 on coAdmin getting my company', function (done) {
      server
        .get('/api/companies/2')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on user getting my company', function (done) {
      server
        .get('/api/companies/2')
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })
  })

  describe('PUT /api/companies', function () {
    it('should return 403 (forbidden) on coAdmin - not my company', function (done) {
      server
        .put('/api/companies/' + coId)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .send('{"name": "Funky Company" }')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 403 (forbidden) on user - not my company', function (done) {
      server
        .put('/api/companies/' + coId)
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .send('{"name": "Funky Company" }')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 204 on admin', function (done) {
      server
        .put('/api/companies/' + coId)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send('{"name": "Funky Company" }')
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 200 on get with new company name', function (done) {
      server
        .get('/api/companies/' + coId)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var coObj = JSON.parse(res.text)
          coObj.name.should.equal('Funky Company')
          coObj.type.should.equal('devicemfg')
          done()
        })
    })
  })

  describe('DELETE /api/companies', function () {
    it('should return 403 (forbidden) on coAdmin', function (done) {
      server
        .delete('/api/companies/' + coId)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 403 (forbidden) on user', function (done) {
      server
        .delete('/api/companies/' + coId)
        .set('Authorization', 'Bearer ' + userToken)
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 204 on admin', function (done) {
      server
        .delete('/api/companies/' + coId)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 on get', function (done) {
      server
        .get('/api/companies/' + coId)
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
