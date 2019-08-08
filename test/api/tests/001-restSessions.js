var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var createApp = require('../../restApp')
var should = chai.should()

chai.use(chaiHttp)
var server

describe('Sessions', () => {
  var adminToken
  before(async () => {
    const app = await createApp()
    server = chai.request(app).keepOpen()
  })

  describe('POST /api/sessions', () => {
    it('should return 401 when the login is not valid', async () => {
      const res = await server
        .post('/api/sessions')
        .send({ 'login_username': 'foo', 'login_password': 'bar' })
      res.should.have.status(401)
    })

    it('should return 200 and a jwt when the login is valid', async () => {
      const res = await server
        .post('/api/sessions')
        .send({ 'login_username': 'admin', 'login_password': 'password' })
      res.should.have.status(200)
      adminToken = res.text
      console.log("ADMIN_TOKEN", adminToken)
    })

    it('should be able to use the admin jwt to get all companies', async () => {
      const res = await server
        .get('/api/companies')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
      res.should.have.status(200)
      var result = JSON.parse(res.text)
      result.records.should.be.instanceof(Array)
    })
  })

  describe('DELETE /api/sessions', () => {
    it('should return 401 with no token', async () => {
      const res = await server
        .delete('/api/sessions')
      res.should.have.status(401)
    })

    it('should return 204 when the login is valid', async () => {
      const res = await server
        .delete('/api/sessions')
        .set('Authorization', 'Bearer ' + adminToken)
      res.should.have.status(204)
      adminToken = {}
    })
  })
})
