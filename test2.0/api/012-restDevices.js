var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var createApp = require('../../restApp')
var should = chai.should()

chai.use(chaiHttp)
var server

describe('Devices', function () {
  var adminToken
  var appId

  before('User Sessions', async () => {
    const app = await createApp()
    server = chai.request(app).keepOpen()
    let res = await server
      .post('/api/sessions')
      .send({ 'login_username': 'admin', 'login_password': 'password' })
    adminToken = res.text
    res = await server
      .post('/api/applications')
      .set('Authorization', 'Bearer ' + adminToken)
      .set('Content-Type', 'application/json')
      .send({
        'companyId': 1,
        'name': 'MyGetRichQuickApp2',
        'description': 'A really good idea that was boring',
        'baseUrl': 'http://localhost:5086',
        'reportingProtocolId': 1
      })
    appId = JSON.parse(res.text).id
  })

  var devId1
  var devId2
  describe('POST /api/devices', function () {
    it('should return 200 on admin', function (done) {
      server
        .post('/api/devices')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'applicationId': appId,
          'name': 'MGRQD002',
          'description': 'My Get Rich Quick Device 002',
          'deviceModel': 'Mark1' })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          devId1 = ret.id
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .post('/api/devices')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'applicationId': appId,
          'name': 'MGRQD003',
          'description': 'My Get Rich Quick Device 003',
          'deviceModel': 'Mark2' })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          devId2 = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/devices/' + devId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var devObj = JSON.parse(res.text)
          devObj.name.should.equal('MGRQD002')
          devObj.description.should.equal('My Get Rich Quick Device 002')
          devObj.deviceModel.should.equal('Mark1')
          done()
        })
    })
  })

  describe('GET /api/devices (search/paging)', function () {
    it('should return 200 with 2 device on admin', function (done) {
      server
        .get('/api/devices')
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

    it('should return 200 with 2 devices on admin', function (done) {
      server
        .get('/api/devices')
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
        .get('/api/devices')
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

    it('should return 200 with 2 device on admin, search MGR%', function (done) {
      server
        .get('/api/devices')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': 'MGR%' })
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

    it('should return 200 with 2 devices on admin, search MG%', function (done) {
      server
        .get('/api/devices')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': 'MG%' })
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

    it('should return 200 with 2 device on admin, search M%', function (done) {
      server
        .get('/api/devices')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': 'M%' })
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

  describe('GET /api/devices/{id}', function () {
    it('should return 200 on admin', function (done) {
      server
        .get('/api/devices/' + devId2)
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
        .get('/api/devices/' + devId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          ret.id.should.equal(devId2)
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/devices/' + devId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var devObj = JSON.parse(res.text)
          devObj.name.should.equal('MGRQD002')
          devObj.applicationId.should.equal(appId)
          done()
        })
    })

    it('should return 200 on admin getting my device', function (done) {
      server
        .get('/api/devices/' + devId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          done()
        })
    })

  })

  describe('PUT /api/devices', function () {
    it('should return 204 on admin', function (done) {
      server
        .put('/api/devices/' + devId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send('{"name": "Funky Device" }')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(204)
          done()
        })
    })

    it('should return 204 on admin', function (done) {
      server
        .put('/api/devices/' + devId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send('{"name": "Funky Punky Device" }')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(204)
          done()
        })
    })

    it('should return 200 on get with new device name', function (done) {
      server
        .get('/api/devices/' + devId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var coObj = JSON.parse(res.text)
          coObj.name.should.equal('Funky Punky Device')
          done()
        })
    })
  })

  describe('DELETE /api/devices', function () {
    it('should return 204 on admin', function (done) {
      server
        .delete('/api/devices/' + devId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 on get', function (done) {
      server
        .get('/api/devices/' + devId2)
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
