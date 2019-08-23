var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
const { createApp } = require('../../../app/rest-server/app')
var should = chai.should()

chai.use(chaiHttp)
var server

var npId1
var npId2

describe('ReportingProtocols', function () {
  var adminToken

  before('User Sessions', async () => {
    const app = await createApp()
    server = chai.request(app).keepOpen()
    let res = await server
      .post('/api/sessions')
      .send({ 'username': 'admin', 'password': 'password' })
    adminToken = res.text
  })

  describe('POST /api/reporting-protocols', function () {

    it('should return 200 on creating new reporting Protocol with admin account #1', function (done) {
      server
        .post('/api/reporting-protocols')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'name': 'LoRa Server', 'networkTypeId': 1, 'protocolHandler': 'LoRaOpenSource.js' })
        .end(function (err, res) {
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          npId1 = ret.id
          done()
        })
    })

    it('should return 200 on creating new reporting Protocol with admin account #2', function (done) {
      server
        .post('/api/reporting-protocols')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'name': 'T-Mobile NB-IoT', 'networkTypeId': 2, 'protocolHandler': 'TMobileNBIoT.js' })
        .end(function (err, res) {
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          npId2 = ret.id
          done()
        })
    })
  })
  describe('GET /api/reporting-protocols', function () {
    it('should return 200 with 3 protocols on admin', function (done) {
      server
        .get('/api/reporting-protocols')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.should.have.property('totalCount')
          result.should.have.property('records')
          result.records.should.have.length(3)
          done()
        })
    })

    it.skip('should return 200 with 1 protocol search NB-IoT', function (done) {
      server
        .get('/api/reporting-protocols?search=%NB-IoT%')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.should.have.property('totalCount')
          result.should.have.property('records')
          result.records.should.have.length(1)
          result.totalCount.should.equal(1)
          done()
        })
    })
    it.skip('should return 200 with 1 protocol limit 1 offset 1', function (done) {
      server
        .get('/api/reporting-protocols?limit=1&offset=1')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.should.have.property('totalCount')
          result.should.have.property('records')
          result.records.should.have.length(1)
          result.totalCount.should.equal(1)
          done()
        })
    })
  })

  describe('GET /api/reporting-protocols/{id}', function () {
    it('should return 200 on admin', function (done) {
      server
        .get('/api/reporting-protocols/' + npId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on user', function (done) {
      server
        .get('/api/reporting-protocols/' + npId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .get('/api/reporting-protocols/' + npId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })
  })

  describe('PUT /api/reporting-protocols', function () {

    it('should return 204 on admin', function (done) {
      server
        .put('/api/reporting-protocols/' + npId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send('{"name": "Sprint NB-IoT" }')
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 200 on get with new company name', function (done) {
      server
        .get('/api/reporting-protocols/' + npId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var coObj = JSON.parse(res.text)
          coObj.name.should.equal('Sprint NB-IoT')
          done()
        })
    })
  })

  describe('DELETE /api/reporting-protocols', function () {
    it('should return 204 on admin', function (done) {
      server
        .delete('/api/reporting-protocols/' + npId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 204 on admin', function (done) {
      server
        .delete('/api/reporting-protocols/' + npId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 on get', function (done) {
      server
        .get('/api/reporting-protocols/' + npId2)
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
