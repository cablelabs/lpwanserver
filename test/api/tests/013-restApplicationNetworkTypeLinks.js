var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
const { createApp } = require('../../../app/rest-server/app')
var should = chai.should()

chai.use(chaiHttp)
var server

describe.skip('ApplicationNetworkTypeLinks', function () {
  var adminToken

  before('User Sessions', async () => {
    const app = await createApp()
    server = chai.request(app).keepOpen()
    let res = await server
      .post('/api/sessions')
      .send({ 'username': 'admin', 'password': 'password' })
    adminToken = res.text
  })

  var anlId1
  var anlId2
  describe('POST /api/application-network-type-links', function () {
    it('should return 403 (forbidden) on user', function (done) {
      server
        .post('/api/application-network-type-links')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'applicationId': 1,
          'networkTypeId': 1,
          'networkSettings': { } })
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .post('/api/application-network-type-links')
        .set('Authorization', 'Bearer ' + adminToken)
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
        .post('/api/application-network-type-links')
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
        .get('/api/application-network-type-links/' + anlId1)
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

  describe('GET /api/application-network-type-links (search/paging)', function () {
    it('should return 200 with 2 applicationNetworkTypeLink on admin', function (done) {
      server
        .get('/api/application-network-type-links')
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

    it('should return 200 on user', function (done) {
      server
        .get('/api/application-network-type-links')
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

    it('should return 200 with 2 applicationNetworkTypeLinks on admin', function (done) {
      server
        .get('/api/application-network-type-links')
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
        .get('/api/application-network-type-links')
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

  describe('GET /api/application-network-type-links/{id}', function () {
    it('should return 200 on admin', function (done) {
      server
        .get('/api/application-network-type-links/' + anlId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on user', function (done) {
      server
        .get('/api/application-network-type-links/' + anlId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .get('/api/application-network-type-links/' + anlId2)
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
        .get('/api/application-network-type-links/' + anlId1)
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
        .get('/api/application-network-type-links/' + anlId2)
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

    it('should return 200 on admin getting my application', function (done) {
      server
        .get('/api/application-network-type-links/' + anlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on user getting my application', function (done) {
      server
        .get('/api/application-network-type-links/' + anlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })
  })

  describe('PUT /api/application-network-type-links', function () {
    it('should return 200 on admin', function (done) {
      server
        .put('/api/application-network-type-links/' + anlId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'networkSettings': { 'description': 'Demo app 2' } })
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 403 (forbidden) on user', function (done) {
      server
        .put('/api/application-network-type-links/' + anlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'networkSettings': { 'description': 'Demo app 1' } })
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .put('/api/application-network-type-links/' + anlId1)
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
        .get('/api/application-network-type-links/' + anlId1)
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
        .delete('/api/application-network-type-links/' + anlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .delete('/api/application-network-type-links/' + anlId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 404 on get', function (done) {
      server
        .get('/api/application-network-type-links/' + anlId2)
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
