var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
const { createApp } = require('../../../app/rest-server/app')
var should = chai.should()

chai.use(chaiHttp)
var server

var npId1

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

  describe('GET /api/reporting-protocols', function () {
    it('should return 200 with 1 protocol on admin', function (done) {
      server
        .get('/api/reporting-protocols')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.should.have.property('totalCount')
          result.should.have.property('records')
          result.records.should.have.length(1)
          npId1 = result.records[0].id
          done()
        })
    })

    it('should return 200 with 1 protocol search POST', function (done) {
      server
        .get('/api/reporting-protocols?search=POST')
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
    it('should return 200 with 0 protocols limit 1 offset 1', function (done) {
      server
        .get('/api/reporting-protocols?limit=1&offset=1')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.should.have.property('totalCount')
          result.should.have.property('records')
          result.records.should.have.length(0)
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
  })
})
