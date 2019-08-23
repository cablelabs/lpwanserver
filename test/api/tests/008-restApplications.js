var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
const { createApp } = require('../../../app/rest-server/app')
var should = chai.should()
const { prisma } = require('../../../app/generated/prisma-client')

chai.use(chaiHttp)
var server
let companyId
let reportingProtocolId

describe('Applications', function () {
  var adminToken

  before('User Sessions', async () => {
    const app = await createApp()
    server = chai.request(app).keepOpen()
    let res = await server
      .post('/api/sessions')
      .send({ 'username': 'admin', 'password': 'password' })
    adminToken = res.text
    const cos = await prisma.companies({ first: 1 })
    companyId = cos[0].id
    const reportingProtos = await prisma.reportingProtocols({ first: 1 })
    reportingProtocolId = reportingProtos[0].id
  })

  var appId1
  var appId2
  describe('POST /api/applications', function () {
    it('should return 200 on admin', function (done) {
      server
        .post('/api/applications')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'companyId': companyId,
          'name': 'MyGetRichQuickApp',
          'description': 'A really good idea that was boring',
          'baseUrl': 'http://localhost:5086',
          'reportingProtocolId': reportingProtocolId })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          appId1 = ret.id

          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .post('/api/applications')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'companyId': companyId,
          'name': 'MyEnterpriseApp',
          'description': 'Ugh, enterprise apps',
          'baseUrl': 'http://localhost:5086',
          'reportingProtocolId': reportingProtocolId })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          appId2 = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/applications/' + appId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var appObj = JSON.parse(res.text)
          appObj.name.should.equal('MyGetRichQuickApp')
          appObj.description.should.equal('A really good idea that was boring')
          appObj.reportingProtocolId.should.equal(reportingProtocolId)
          done()
        })
    })
  })

  describe('GET /api/applications (search/paging)', function () {
    it('should return 200 with 2 applications on admin', function (done) {
      server
        .get('/api/applications')
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

    it('should return 200 with 1 application on admin, limit 2, offset 1', function (done) {
      server
        .get('/api/applications')
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

    it('should return 200 with 1 application on admin, search MyGetRich%', function (done) {
      server
        .get('/api/applications')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': 'MyGetRich%' })
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

    it('should return 200 with 2 applications on admin, search My%', function (done) {
      server
        .get('/api/applications')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': 'My%' })
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

    it('should return 200 with 1 application on admin, search My%', function (done) {
      server
        .get('/api/applications')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'search': 'My%' })
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
  })

  describe('GET /api/applications/{id}', function () {
    it('should return 200 on admin', function (done) {
      server
        .get('/api/applications/' + appId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          ret.id.should.equal(appId2)
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/applications/' + appId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var appObj = JSON.parse(res.text)
          appObj.name.should.equal('MyGetRichQuickApp')
          appObj.reportingProtocolId.should.equal(reportingProtocolId)
          done()
        })
    })

    it('should return 200 on admin getting my application', function (done) {
      server
        .get('/api/applications/' + appId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          done()
        })
    })
  })

  describe('PUT /api/applications', function () {
    it('should return 204 on admin', function (done) {
      server
        .put('/api/applications/' + appId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send('{"name": "Funky Application" }')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(204)
          done()
        })
    })

    it('should return 200 on get with new application name', function (done) {
      server
        .get('/api/applications/' + appId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var coObj = JSON.parse(res.text)
          coObj.name.should.equal('Funky Application')
          done()
        })
    })
  })

  describe('DELETE /api/applications', function () {

    it('should return 204 on admin', function (done) {
      server
        .delete('/api/applications/' + appId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 on get', function (done) {
      server
        .get('/api/applications/' + appId2)
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
