// General libraries in use in this module.
var { logger } = require('../log')

var restServer
var modelAPI

exports.initialize = function (app, server) {
  restServer = server
  modelAPI = server.modelAPI

  app.post('/api/sessions', function (req, res) {
    modelAPI.sessions.authenticateUser(req.body).then(
      token => {
        restServer.respond(res, null, token)
      },
      err => {
        console.log(err)
        restServer.respond(res, err)
      }
    )
  })

  app.delete('/api/sessions', [ restServer.isLoggedIn ], function (req, res, next) {
    modelAPI.sessions.delete(req, res, next).then(function () {
      restServer.respond(res, 204)
    })
      .catch(function (err) {
        logger.error('Error on session logout: ', err)
        restServer.respond(res, err)
      })
  })
}
