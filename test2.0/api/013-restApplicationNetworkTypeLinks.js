var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var app = require('../../restApp.js')
var should = chai.should()

chai.use(chaiHttp)
var server = chai.request(app).keepOpen()

describe.skip('ApplicationNetworkTypeLinks', function () {
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

  var anlId1
  var anlId2
  describe('POST /api/applicationNetworkTypeLinks', function () {
    it('should return 403 (forbidden) on user', function (done) {
      server
        .post('/api/applicationNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .send({ 'applicationId': 1,
          'networkTypeId': 1,
          'networkSettings': { } })
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 on coAdmin', function (done) {
      server
        .post('/api/applicationNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .send({ 'applicationId': 1,
          'networkTypeId': 1,
          'networkSettings': { } })
        .end(function (err, res) {
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          anlId1 = ret.id

          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .post('/api/applicationNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'applicationId': 1,
          'networkTypeId': 2,
          'networkSettings': { } })
        .end(function (err, res) {
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          anlId2 = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + anlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var appObj = JSON.parse(res.text)
          appObj.applicationId.should.equal(1)
          appObj.networkTypeId.should.equal(1)
          done()
        })
    })
  })

  describe('GET /api/applicationNetworkTypeLinks (search/paging)', function () {
    it('should return 200 with 2 applicationNetworkTypeLink on coAdmin', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(2)
          result.totalCount.should.equal(2)
          done()
        })
    })

    it('should return 200 on user', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(2)
          result.totalCount.should.equal(2)
          done()
        })
    })

    it('should return 200 with 2 applicationNetworkTypeLinks on admin', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(2)
          result.totalCount.should.equal(2)
          done()
        })
    })

    it('should return 200 with 1 applicationNetworkTypeLink on admin, limit 2, offset 1', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'limit': 2, 'offset': 1 })
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(1)
          result.totalCount.should.equal(2)
          done()
        })
    })
  })

  describe('GET /api/applicationNetworkTypeLinks/{id}', function () {
    it('should return 200 on coAdmin', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + anlId2)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on user', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + anlId2)
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + anlId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          ret.id.should.equal(anlId2)
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + anlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var appObj = JSON.parse(res.text)
          appObj.applicationId.should.equal(1)
          appObj.networkTypeId.should.equal(1)
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + anlId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var appObj = JSON.parse(res.text)
          appObj.applicationId.should.equal(1)
          appObj.networkTypeId.should.equal(2)
          done()
        })
    })

    it('should return 200 on coAdmin getting my application', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + anlId1)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on user getting my application', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + anlId1)
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })
  })

  describe('PUT /api/applicationNetworkTypeLinks', function () {
    it('should return 200 on coAdmin', function (done) {
      server
        .put('/api/applicationNetworkTypeLinks/' + anlId2)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .send({ 'networkSettings': { 'description': 'Demo app 2' } })
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 403 (forbidden) on user', function (done) {
      server
        .put('/api/applicationNetworkTypeLinks/' + anlId1)
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .send({ 'networkSettings': { 'description': 'Demo app 1' } })
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .put('/api/applicationNetworkTypeLinks/' + anlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'networkSettings': { 'description': 'Demo app 1' } })
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on get with new networkSettings', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + anlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var appObj = JSON.parse(res.text)
          appObj.networkSettings.description.should.equal('Demo app 1')
          done()
        })
    })
  })

  describe('DELETE /api/applicationNetworkTypes', function () {
    it('should return 403 (forbidden) on user', function (done) {
      server
        .delete('/api/applicationNetworkTypeLinks/' + anlId1)
        .set('Authorization', 'Bearer ' + userToken)
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .delete('/api/applicationNetworkTypeLinks/' + anlId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 404 on get', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + anlId2)
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
