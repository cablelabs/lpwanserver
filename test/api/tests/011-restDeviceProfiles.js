var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
const { createApp } = require('../../../app/rest-server/app')
var should = chai.should()
const { prisma } = require('../../../app/generated/prisma-client')

chai.use(chaiHttp)
var server
let nwkTypeId

describe('DeviceProfiles', function () {
  var adminToken

  before('User Sessions', async () => {
    const app = await createApp()
    server = chai.request(app).keepOpen()
    let res = await server
      .post('/api/sessions')
      .send({ 'username': 'admin', 'password': 'password' })
    adminToken = res.text
    const nwkTypes = await prisma.networkTypes()
    nwkTypeId = nwkTypes[0].id
  })

  var dpId1
  var dpId2
  describe('POST /api/device-profiles', function () {

    it('should return 200 on admin', function (done) {
      server
        .post('/api/device-profiles')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({
          'networkTypeId': nwkTypeId,
          'name': 'LoRaGPSNode',
          'description': 'GPS Node that works with LoRa',
          'networkSettings': { 'foo': 'bar' }
        })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(201)
          var ret = JSON.parse(res.text)
          dpId1 = ret.id

          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .post('/api/device-profiles')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({
          'networkTypeId': nwkTypeId,
          'name': 'LoRaWeatherNode',
          'description': 'GPS Node that works with LoRa',
          'networkSettings': { 'tempType': 'C' }
        })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(201)
          var ret = JSON.parse(res.text)
          dpId2 = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/device-profiles/' + dpId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var dpObj = JSON.parse(res.text)
          dpObj.name.should.equal('LoRaGPSNode')
          dpObj.description.should.equal('GPS Node that works with LoRa')
          dpObj.networkTypeId.should.equal(nwkTypeId)
          done()
        })
    })
  })

  describe('GET /api/device-profiles (search/paging)', function () {
    it('should return 200 with 2 deviceProfiles on admin', function (done) {
      server
        .get('/api/device-profiles')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(3)
          result.totalCount.should.equal(3)
          done()
        })
    })

    it('should return 200 with 1 device on admin, limit 2, offset 1', function (done) {
      server
        .get('/api/device-profiles')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'limit': 2, 'offset': 1 })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(2)
          result.totalCount.should.equal(3)
          done()
        })
    })

    it('should return 200 with 2 deviceProfiles on admin, search LoRa%', function (done) {
      server
        .get('/api/device-profiles')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': 'LoRa%' })
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

    it('should return 200 with 1 deviceProfiles on admin, search LoRaGPS%', function (done) {
      server
        .get('/api/device-profiles')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': 'LoRaGPS%' })
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

    it('should return 200 with 2 device on admin, search L%', function (done) {
      server
        .get('/api/device-profiles')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': 'L%' })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(3)
          result.totalCount.should.equal(3)
          done()
        })
    })
  })

  describe('GET /api/device-profiles/{id}', function () {
    it('should return 200 on admin', function (done) {
      server
        .get('/api/device-profiles/' + dpId2)
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
        .get('/api/device-profiles/' + dpId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          ret.id.should.equal(dpId1)
          done()
        })
    })

    it('should return 200 on admin getting my device', function (done) {
      server
        .get('/api/device-profiles/' + dpId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          done()
        })
    })

  })

  describe('PUT /api/device-profiles', function () {
    it('should return 204 on admin', function (done) {
      server
        .put('/api/device-profiles/' + dpId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send('{"name": "Funky DeviceProfile" }')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(204)
          done()
        })
    })

    it('should return 204 on admin', function (done) {
      server
        .put('/api/device-profiles/' + dpId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send('{"name": "Funky Punky DeviceProfile" }')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(204)
          done()
        })
    })

    it('should return 200 on get with new device name', function (done) {
      server
        .get('/api/device-profiles/' + dpId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var coObj = JSON.parse(res.text)
          coObj.name.should.equal('Funky Punky DeviceProfile')
          done()
        })
    })
  })

  describe('DELETE /api/device-profiles', function () {

    it('should return 200 on admin', function (done) {
      server
        .delete('/api/device-profiles/' + dpId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 on get', function (done) {
      server
        .get('/api/device-profiles/' + dpId2)
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
