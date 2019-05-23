var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var createApp = require('../../restApp')
var should = chai.should()

chai.use(chaiHttp)
var server

describe('DeviceProfiles', function () {
  var adminToken

  before('User Sessions', async () => {
    const app = await createApp()
    server = chai.request(app).keepOpen()
    let res = await server
      .post('/api/sessions')
      .send({ 'login_username': 'admin', 'login_password': 'password' })
    adminToken = res.text
  })

  var dpId1
  var dpId2
  describe('POST /api/deviceProfiles', function () {

    it('should return 200 on admin', function (done) {
      server
        .post('/api/deviceProfiles')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'networkTypeId': 1,
          'companyId': 1,
          'name': 'LoRaGPSNode',
          'description': 'GPS Node that works with LoRa',
          'networkSettings': { 'foo': 'bar' } })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          dpId1 = ret.id

          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .post('/api/deviceProfiles')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'networkTypeId': 1,
          'companyId': 1,
          'name': 'LoRaWeatherNode',
          'description': 'GPS Node that works with LoRa',
          'networkSettings': { 'tempType': 'C' } })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          dpId2 = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/deviceProfiles/' + dpId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var dpObj = JSON.parse(res.text)
          dpObj.name.should.equal('LoRaGPSNode')
          dpObj.description.should.equal('GPS Node that works with LoRa')
          dpObj.networkTypeId.should.equal(1)
          dpObj.companyId.should.equal(1)
          done()
        })
    })
  })

  describe('GET /api/deviceProfiles (search/paging)', function () {
    it('should return 200 with 2 deviceProfiles on admin', function (done) {
      server
        .get('/api/deviceProfiles')
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

    it('should return 200 with 2 deviceProfiles on admin', function (done) {
      server
        .get('/api/deviceProfiles')
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
        .get('/api/deviceProfiles')
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
        .get('/api/deviceProfiles')
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
        .get('/api/deviceProfiles')
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
        .get('/api/deviceProfiles')
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

  describe('GET /api/deviceProfiles/{id}', function () {
    it('should return 200 on admin', function (done) {
      server
        .get('/api/deviceProfiles/' + dpId2)
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
        .get('/api/deviceProfiles/' + dpId1)
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
        .get('/api/deviceProfiles/' + dpId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          done()
        })
    })

  })

  describe('PUT /api/deviceProfiles', function () {
    it('should return 204 on admin', function (done) {
      server
        .put('/api/deviceProfiles/' + dpId2)
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
        .put('/api/deviceProfiles/' + dpId2)
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
        .get('/api/deviceProfiles/' + dpId2)
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

  describe('DELETE /api/deviceProfiles', function () {

    it('should return 200 on admin', function (done) {
      server
        .delete('/api/deviceProfiles/' + dpId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          done()
        })
    })

    it('should return 404 on get', function (done) {
      server
        .get('/api/deviceProfiles/' + dpId2)
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
