var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var createApp = require('../../restApp')
var should = chai.should()
const Lora1 = require('../e2e/networks/lora-v1')
// const Lora2 = require('../e2e/networks/lora-v2')
const { prisma } = require('../../prisma/generated/prisma-client')

chai.use(chaiHttp)
var server
let nwkTypeId

describe('Networks', function () {
  var adminToken
  var npId1
  var netProvId

  before('User Sessions', async () => {
    const app = await createApp()
    server = chai.request(app).keepOpen()
    let res = await server
      .post('/api/sessions')
      .send({ 'login_username': 'admin', 'login_password': 'password' })
    adminToken = res.text
    res = await server
      .post('/api/networkProviders')
      .set('Authorization', 'Bearer ' + adminToken)
      .set('Content-Type', 'application/json')
      .send({ 'name': 'Kyrio' })
    netProvId = JSON.parse(res.text).id
    await Lora1.setup()
    // await Lora2.setup()
    nwkTypeId = (await prisma.networkType({ name: 'LoRa' })).id
  })

  var netId1
  var netId2
  describe('POST /api/networks', function () {
    it('Get Network Protocol for Lora OS', function (done) {
      server
        .get('/api/networkProtocols?search=LoRa Server')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(2)
          result.totalCount.should.equal(2)
          npId1 = result.records[0].id
          done()
        })
    })

    it('should return 201 on admin', function (done) {
      server
        .post('/api/networks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({
          'name': 'MachQLoRa',
          'networkProviderId': netProvId,
          'networkTypeId': nwkTypeId,
          'baseUrl': 'https://localhost:9999/api',
          'networkProtocolId': npId1
        })
        .end(function (err, res) {
          if (err) return done(err)
          console.log(res.text)
          res.should.have.status(201)
          var ret = JSON.parse(res.text)
          netId2 = ret.id
          done()
        })
    })

    it('should return 201 on admin', function (done) {
      server
        .post('/api/networks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({
          'name': 'Funky network',
          'networkProviderId': netProvId,
          'networkTypeId': nwkTypeId,
          'baseUrl': 'https://lora_appserver1:8080/api/',
          'networkProtocolId': npId1,
          'securityData': { 'username': 'admin', 'password': 'admin' }
        })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(201)
          var ret = JSON.parse(res.text)
          netId1 = ret.id
          ret.should.have.property('baseUrl')
          ret.baseUrl.should.equal('https://lora_appserver1:8080/api')
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/networks/' + netId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var netObj = JSON.parse(res.text)
          netObj.name.should.equal('Funky network')
          netObj.baseUrl.should.equal('https://lora_appserver1:8080/api')
          done()
        })
    })
  })

  describe('GET /api/networks (search/paging)', function () {
    it('should return 200 with 2 networks on admin', function (done) {
      server
        .get('/api/networks')
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

    it('should return 200 with 2 networks on admin', function (done) {
      server
        .get('/api/networks')
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

    it('should return 200 with 1 network on admin, limit 2, offset 1', function (done) {
      server
        .get('/api/networks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'limit': 2, 'offset': 1 })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(1)
          result.totalCount.should.equal(2)
          done()
        })
    })

    it('should return 200 with 1 network on admin, search %Funky%', function (done) {
      server
        .get('/api/networks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': '%Funky%' })
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

  describe('GET /api/networks/{id}', function () {
    it('should return 200 on admin', function (done) {
      server
        .get('/api/networks/' + netId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .get('/api/networks/' + netId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var netObj = JSON.parse(res.text)
          netObj.name.should.equal('Funky network')
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/networks/' + netId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var netObj = JSON.parse(res.text)
          netObj.name.should.equal('Funky network')
          done()
        })
    })
  })

  describe('PUT /api/networks', function () {
    it('should return 200 on admin', function (done) {
      server
        .put('/api/networks/' + netId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send('{"name": "KyrioLoRa" }')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on get with new network name', function (done) {
      server
        .get('/api/networks/' + netId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var netObj = JSON.parse(res.text)
          netObj.name.should.equal('KyrioLoRa')
          done()
        })
    })
  })

  describe('DELETE /api/networks', function () {
    it('should return 204 on admin', function (done) {
      server
        .delete('/api/networks/' + netId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 on get', function (done) {
      server
        .get('/api/networks/' + netId2)
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
