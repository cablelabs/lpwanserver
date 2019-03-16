/* eslint-disable handle-callback-err */
var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var app = require('../../restApp.js')
var should = chai.should()

chai.use(chaiHttp)
var server = chai.request(app).keepOpen()

var npId1
var npId2
const NUMBER_PROTOCOLS = 3
const NUMBER_PROTOCOL_HANDLERS = 3

function waitForNetworkProtocolRegistration (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('NetworkProtocols', function () {
  var adminToken

  before('User Sessions', async () => {
    await waitForNetworkProtocolRegistration(7000)
    const res = await server
      .post('/api/sessions')
      .send({ 'login_username': 'admin', 'login_password': 'password' })
    adminToken = res.text
  })

  describe('GET /api/networkProtocolHandlers', function () {
    it('should return 200 on admin', function (done) {
      server
        .get('/api/networkProtocolHandlers')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .end(function (err, res) {
          if (err) {
            done(err)
          }
          else {
            res.should.have.status(200)
            let body = JSON.parse(res.text)
            body.should.have.length(NUMBER_PROTOCOLS)
            done()
          }
        })
    })
  })
  describe('GET /api/networkProtocols', function () {
    it('should return 200 with 3 protocols on admin', function (done) {
      server
        .get('/api/networkProtocols')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(NUMBER_PROTOCOLS)
          result.totalCount.should.equal(NUMBER_PROTOCOLS)
          done()
        })
    })

    it('should return 200 with 4 protocols on user', function (done) {
      server
        .get('/api/networkProtocols')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(NUMBER_PROTOCOLS)
          result.totalCount.should.equal(NUMBER_PROTOCOLS)
          done()
        })
    })

    it('should return 200 with 4 protocols on admin', function (done) {
      server
        .get('/api/networkProtocols')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(NUMBER_PROTOCOLS)
          result.totalCount.should.equal(NUMBER_PROTOCOLS)
          done()
        })
    })
    it('should return 200 with 2 protocol search LoraOS ', function (done) {
      server
        .get('/api/networkProtocols?search=LoRa Server')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(2)
          result.totalCount.should.equal(2)
          npId1 = result.records[0].id
          done()
        })
    })
    it('should return 200 with 1 protocol limit 1 offset 1', function (done) {
      server
        .get('/api/networkProtocols?limit=1&offset=1')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(1)
          result.totalCount.should.equal(NUMBER_PROTOCOLS)
          done()
        })
    })
  })

  describe('GET /api/networkProtocols/{id}', function () {
    it('should return 200 on admin', function (done) {
      server
        .get('/api/networkProtocols/' + npId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })
  })
})
