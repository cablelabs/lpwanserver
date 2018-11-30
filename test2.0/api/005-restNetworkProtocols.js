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

describe('NetworkProtocols', function () {
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
      .send({'login_username': 'admin', 'login_password': 'password'})
      .end(function (err, res) {
        if (err) {
          return done(err)
        }
        adminToken = res.text
        waitFunc()
      })

    server
      .post('/api/sessions')
      .send({'login_username': 'clAdmin', 'login_password': 'password'})
      .end(function (err, res) {
        if (err) {
          return done(err)
        }
        coAdminToken = res.text
        waitFunc()
      })

    server
      .post('/api/sessions')
      .send({'login_username': 'clUser', 'login_password': 'password'})
      .end(function (err, res) {
        if (err) {
          return done(err)
        }
        userToken = res.text
        waitFunc()
      })
  })

  describe('GET /api/networkProtocolHandlers', function () {
    it('should return 200 on coAdmin', function (done) {
      server
        .get('/api/networkProtocolHandlers')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .end(function (err, res) {
          if (err) {
            done(err)
          } else {
            res.should.have.status(200)
            let body = JSON.parse(res.text)
            body.should.have.length(NUMBER_PROTOCOLS)
            done()
          }
        })
    })

    it('should return 403 on coAdmin', function (done) {
      server
        .post('/api/networkProtocols')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .send({'name': 'LoRa Server', 'networkTypeId': 1, 'protocolHandler': 'LoRaOpenSource.js'})
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })
  })
  describe('GET /api/networkProtocols', function () {
    it('should return 200 with 4 protocols on coAdmin', function (done) {
      server
        .get('/api/networkProtocols')
        .set('Authorization', 'Bearer ' + coAdminToken)
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
        .set('Authorization', 'Bearer ' + userToken)
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
    it('should return 200 on coAdmin', function (done) {
      server
        .get('/api/networkProtocols/' + npId1)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })
  })

  describe('PUT /api/networkProtocols', function () {
    it('should return 403 (forbidden) on coAdmin', function (done) {
      server
        .put('/api/networkProtocols/' + npId1)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .send('{"name": "I Hacked Your Networks" }')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 403 (forbidden) on user', function (done) {
      server
        .put('/api/networkProtocols/' + npId2)
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .send('{"name": "I Hacked Your Networks" }')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })
  })
})
