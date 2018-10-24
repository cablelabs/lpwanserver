var appLogger = require('./lib/appLogger.js')
const fs = require('fs')
var restServer
var modelAPI

exports.initialize = function (app, server) {
  restServer = server
  modelAPI = server.modelAPI

  /*********************************************************************
     * NetworkProtocols API.
     ********************************************************************/
  /**
     * Gets the networkProtocols available
     *
     * @api {get} /api/networkProtocols Get Network Protocols
     * @apiGroup Network Protocols
     * @apiDescription Returns an array of the Network Protocols that
     *      match the options.
     * @apiPermission All logged-in users.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Query Parameters) {Number} [limit] The maximum number of
     *      records to return.  Use with offset to manage paging.  0 is the
     *      same as unspecified, returning all users that match other query
     *      parameters.
     * @apiParam (Query Parameters) {Number} [offset] The offset into the
     *      returned database query set.  Use with limit to manage paging.  0 is
     *      the same as unspecified, returning the list from the beginning.
     * @apiParam (Query Parameters) {String} [search] Search the Network
     *      Protocols based on name matches to the passed string.  In the
     *      string, use "%" to match 0 or more characters and "_" to match
     *      exactly one.  For example, to match names starting with "D", use
     *      the string "D%".
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.totalCount The total number of records that
     *      would have been returned if offset and limit were not specified.
     *      This allows for calculation of number of "pages" of data.
     * @apiSuccess {Object[]} object.records An array of Network Protocols
     *      records.
     * @apiSuccess {Number} object.records.id The Network Protocol's Id
     * @apiSuccess {String} object.records.name The name of the Network Protocol
     * @apiSuccess {String} object.records.protocolHandler The Network Protocol
     *      node code that communicates with a remote Network.
     * @apiSuccess {Number} object.records.networkTypeId The id of the Network
     *      Type that the Network Protocol uses for data input.
     * @apiVersion 0.1.0
     */

  app.get('/api/networkProtocols', [restServer.isLoggedIn],
    function (req, res, next) {
      var options = {}
      if (req.query.limit) {
        var limitInt = parseInt(req.query.limit)
        if (!isNaN(limitInt)) {
          options.limit = limitInt
        }
      }
      if (req.query.offset) {
        var offsetInt = parseInt(req.query.offset)
        if (!isNaN(offsetInt)) {
          options.offset = offsetInt
        }
      }
      if (req.query.search) {
        options.search = req.query.search
      }
      if (req.query.networkTypeId) {
        options.networkTypeId = req.query.networkTypeId
      }
      if (req.query.networkProtocolVersion) {
        options.networkProtocolVersion = req.query.networkProtocolVersion
      }
      modelAPI.networkProtocols.retrieveNetworkProtocols(options).then(function (nps) {
        // restServer.respondJson(res, null, nps)
        restServer.respond(res, 200, nps)
      })
        .catch(function (err) {
          appLogger.log('Error getting networkProtocols: ' + err)
          restServer.respond(res, err)
        })
    })

  app.get('/api/networkProtocols/group', [restServer.isLoggedIn],
    function (req, res, next) {
      var options = {}
      if (req.query.limit) {
        var limitInt = parseInt(req.query.limit)
        if (!isNaN(limitInt)) {
          options.limit = limitInt
        }
      }
      if (req.query.offset) {
        var offsetInt = parseInt(req.query.offset)
        if (!isNaN(offsetInt)) {
          options.offset = offsetInt
        }
      }
      if (req.query.search) {
        options.search = req.query.search
      }
      if (req.query.networkTypeId) {
        options.networkTypeId = req.query.networkTypeId
      }
      modelAPI.networkProtocols.retrieveNetworkProtocols(options).then(function (recs) {
        let nps = {
          totalCount: recs.totalCount,
          records: []
        }
        let len = recs.records.length
        for (let i = 0; i < len; i++) {
          let rec = recs.records[i]
          let found = false
          let counter = 0
          while (!found && counter < nps.records.length) {
            if (nps.records[counter].name === rec.name) {
              found = true
              nps.records[counter].versions.push(rec)
            }
            else {
              counter++
            }
          }
          // Not found
          if (!found) {
            nps.records.push({
              name: rec.name,
              masterProtocol: rec.masterProtocol,
              networkTypeId: rec.networkTypeId,
              versions: [rec]
            })
          }
        }
        console.log(JSON.stringify(nps))
        restServer.respond(res, 200, nps)
      })
        .catch(function (err) {
          appLogger.log('Error getting networkProtocols: ' + err)
          restServer.respond(res, err)
        })
    })

  /**
     * @apiDescription Gets the Network Protocol record with the specified id.
     *
     * @api {get} /api/networkProtocols/:id Get Network Protocol
     * @apiGroup Network Protocols
     * @apiPermission Any logged-in user.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Network Protocol's id
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.id The Network Protocol's Id
     * @apiSuccess {String} object.name The name of the Network Protocol
     * @apiSuccess {String} object.protocolHandler The Network Protocol
     *      node code that communicates with a remote Network.
     * @apiSuccess {Number} object.networkTypeId The id of the Network
     *      Type that the Network Protocol uses for data input.
     * @apiVersion 0.1.0
     */
  app.get('/api/networkProtocols/:id', [restServer.isLoggedIn],
    function (req, res, next) {
      modelAPI.networkProtocols.retrieveNetworkProtocol(parseInt(req.params.id)).then(function (np) {
        // restServer.respondJson(res, null, np)
        restServer.respond(res, 200, np)
      })
        .catch(function (err) {
          appLogger.log('Error getting networkProtocol ' + req.params.id + ': ' + err)
          restServer.respond(res, err)
        })
    })

  /**
     * @apiDescription Creates a new Network Protocols record.
     *
     * @api {post} /api/networkProtocols Create Network Protocol
     * @apiGroup Network Protocols
     * @apiPermission System Admin
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Request Body) {String} name The Network Protocol's name
     * @apiParam (Request Body) {String} protocolHandler The Network Protocol
     *      node code that communicates with a remote Network.
     * @apiParam (Request Body) {Number} networkTypeId The Id of the Network
     *      Type that the Network Protocol accepts as input.
     * @apiExample {json} Example body:
     *      {
     *          "name": "LoRa Server",
     *          "protocolHandler": "LoRaOpenSource.js"
     *          "networkTypeId": 1
     *      }
     * @apiSuccess {Number} id The new Network Protocol's id.
     * @apiVersion 0.1.0
     */
  app.post('/api/networkProtocols', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdminCompany],
  function (req, res, next) {
    let methodNotAllowed = {
      error: 'POST to /api/networkProtocols is not allowed.  Please see documentation for more details.'
    }
    restServer.respond(res, 405, methodNotAllowed)
    // var rec = req.body
    // // You can't specify an id.
    // if (rec.id) {
    //   restServer.respond(res, 400, "Cannot specify the networkProtocol's id in create")
    //   return
    // }
    //
    // // Verify that required fields exist.
    // if (!rec.name || !rec.networkTypeId || !rec.protocolHandler) {
    //   restServer.respond(res, 400, 'Missing required data')
    //   return
    // }
    //
    // // Do the add.
    // modelAPI.networkProtocols.createNetworkProtocol(
    //   rec.name,
    //   rec.networkTypeId,
    //   rec.protocolHandler).then(function (rec) {
    //   var send = {}
    //   send.id = rec.id
    //   restServer.respondJson(res, 200, send)
    // })
    //   .catch(function (err) {
    //     appLogger.log(err)
    //     restServer.respond(res, err)
    //   })
  })

  /**
     * @apiDescription Updates the Network Protocol record with the specified
     *      id.
     *
     * @api {put} /api/networkProtocols/:id Update Network Protocol
     * @apiGroup Network Protocols
     * @apiPermission System Admin
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} networkProtocolHandlersid The Network Protocol's id
     * @apiParam (Request Body) {String} [name] The Network Protocol's name
     * @apiParam (Request Body) {String} [protocolHandler] The Network Protocol
     *      node code that communicates with a remote Network.
     * @apiParam (Request Body) {Number} [networkTypeId] The Id of the Network
     *      Type that the Network Protocol accepts as input.
     * @apiExample {json} Example body:
     *      {
     *          "name": "LoRa Server",
     *          "protocolHandler": "LoRaOpenSource.js",
     *          "networkTypeId": 1
     *      }
     * @apiVersion 0.1.0
     */
  app.put('/api/networkProtocols/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdminCompany],
  function (req, res, next) {
    var data = {}
    data.id = parseInt(req.params.id)
    // We'll start by getting the company, as a read is much less expensive
    // than a write, and then we'll be able to tell if anything really
    // changed before we even try to write.
    modelAPI.networkProtocols.retrieveNetworkProtocol(req.params.id).then(function (np) {
      // Fields that may exist in the request body that can change.  Make
      // sure they actually differ, thnetworkProtocolHandlersough.
      var changed = 0
      if ((req.body.name) &&
                 (req.body.name != np.name)) {
        data.name = req.body.name
        ++changed
      }
      if (req.body.protocolHandler) {
        if (req.body.protocolHandler != np.protocolHandler) {
          data.protocolHandler = req.body.protocolHandler
          ++changed
        }
      }
      if (req.body.networkTypeId) {
        if (req.body.networkTypeId != np.networkTypeId) {
          data.networkTypeId = req.body.networkTypeId
          ++changed
        }
      }

      // Ready.  DO we have        appLogger.log(nps)
      if (changed == 0) {
        // No changes.  But returning 304 apparently causes Apache to strip
        // CORS info, causing the browser to throw a fit.  So just say,
        // "Yeah, we did that.  Really.  Trust us."
        restServer.respond(res, 204)
      }
      else {
        // Do the update.
        modelAPI.networkProtocols.updateNetworkProtocol(data).then(function (rec) {
          restServer.respond(res, 204)
        })
          .catch(function (err) {
            restServer.respond(res, err)
          })
      }
    })
      .catch(function (err) {
        appLogger.log('Error getting networkProtocol ' + data.id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Deletes the Network Protocol record with the specified
     *      id.
     *
     * @api {delete} /api/networkProtocols/:id Delete Network Protocol
     * @apiGroup Network Protocols
     * @apiPermission System AdminnetworkProtocolHandlers
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Network Protocol's id
     * @apiVersion 0.1.0
     */
  app.delete('/api/networkProtocols/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdminCompany],
  function (req, res, next) {
    let methodNotAllowed = {
      error: 'DELETE to /api/networkProtocols is not allowed.  Please see documentation for more details.'
    }
    restServer.respond(res, 405, methodNotAllowed)
    // var id = parseInt(req.params.id)
    // modelAPI.networkProtocols.deleteNetworkProtocol(id).then(function () {
    //   restServer.respond(res, 204)
    // })
    //   .catch(function (err) {
    //     appLogger.log('Error deleting network protocol ' + id + ': ' + err)
    //     restServer.respond(res, err)
    //   })
  })

  /**
     * @apiDescription Gets the Network Protocol Handlers avalible.
     *
     * @api {get} /api/networkProtocolsHandlers/ Get Network Protocol
     * @apiGroup Network Protocols
     * @apiPermission Any logged-in user.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiSuccess {Array} array of protocol handlers available.
     * @apiVersion 0.1.0
     */
  app.get('/api/networkProtocolHandlers/', [restServer.isLoggedIn],
    function (req, res, next) {
      let fileList = fs.readdirSync('./rest/networkProtocols/')
      let handlerList = []
      for (onefile in fileList) {
        if (
          fileList[onefile] === 'networkProtocolDataAccess.js' ||
                    fileList[onefile] === 'networkProtocols.js' ||
                    fileList[onefile] === 'networkTypeApi.js' ||
                    fileList[onefile] === 'protocoltemplate.js' ||
                    fileList[onefile] === 'README.txt'
        ) {
        }
        else {
          let temp = {
            id: fileList[onefile],
            name: fileList[onefile].split('.')[0]
          }
          handlerList.push(temp)
        }
      }
      restServer.respondJson(res, null, handlerList)
    })
}
