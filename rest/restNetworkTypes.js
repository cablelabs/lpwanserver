var appLogger = require('./lib/appLogger.js')
var restServer
var modelAPI

exports.initialize = function (app, server) {
  restServer = server
  modelAPI = server.modelAPI

  /*********************************************************************
     * NetworkTypes API.
     ********************************************************************
    /**
     * Gets the networkTypes available
     *
     * @api {get} /api/networkTypes Get Network Types
     * @apiGroup Network Types
     * @apiDescription Returns an array of the Network Types that
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
     *      Types based on name matches to the passed string.  In the
     *      string, use "%" to match 0 or more characters and "_" to match
     *      exactly one.  For example, to match names starting with "D", use
     *      the string "D%".
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.totalCount The total number of records that
     *      would have been returned if offset and limit were not specified.
     *      This allows for calculation of number of "pages" of data.
     * @apiSuccess {Object[]} object.records An array of Network Types
     *      records.
     * @apiSuccess {Number} object.records.id The Network Type's Id
     * @apiSuccess {String} object.records.name The name of the Network Type
     * @apiVersion 0.1.0
     */
  app.get('/api/networkTypes', [restServer.isLoggedIn], function (req, res, next) {
    modelAPI.networkTypes.list().then(function (nts) {
      restServer.respondJson(res, null, nts)
    })
      .catch(function (err) {
        appLogger.log('Error getting networkTypes: ' + err)
        restServer.respond(res, err)
      })
  })

  /**
    * @apiDescription Gets the Network Type record with the specified id.
    *
    * @api {get} /api/networkTypes/:id Get Network Type
    * @apiGroup Network Types
    * @apiPermission Any logged-in user.
    * @apiHeader {String} Authorization The Create Session's returned token
    *      prepended with "Bearer "
    * @apiParam (URL Parameters) {Number} id The Network Type's id
    * @apiSuccess {Object} object
    * @apiSuccess {Number} object.id The Network Type's Id
    * @apiSuccess {String} object.name The name of the Network Type
    * @apiVersion 0.1.0
     */
  app.get('/api/networkTypes/:id', [restServer.isLoggedIn],
    function (req, res, next) {
      var id = req.params.id
      modelAPI.networkTypes.load(parseInt(req.params.id)).then(function (rp) {
        restServer.respondJson(res, null, rp)
      })
        .catch(function (err) {
          appLogger.log('Error getting networkType ' + req.params.id + ': ' + err)
          restServer.respond(res, err)
        })
    })

  /**
    * @apiDescription Creates a new networkTypes record.
    *
    * @api {post} /api/networkTypes Create Network Type
    * @apiGroup Network Types
    * @apiPermission System Admin
    * @apiHeader {String} Authorization The Create Session's returned token
    *      prepended with "Bearer "
    * @apiParam (Request Body) {String} name The Network Type's name
    * @apiExample {json} Example body:
    *      {
    *          "name": "NB-IoT"
    *      }
    * @apiSuccess {Number} id The new Network Type's id.
     */
  app.post('/api/networkTypes', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdminCompany],
  function (req, res, next) {
    var rec = req.body
    // You can't specify an id.
    if (rec.id) {
      restServer.respond(res, 400, "Cannot specify the networkType's id in create")
      return
    }

    // Verify that required fields exist.
    if (!rec.name) {
      restServer.respond(res, 400, 'Missing required data')
      return
    }

    // Do the add.
    modelAPI.networkTypes.create(rec.name).then(function (rec) {
      var send = {}
      send.id = rec.id
      restServer.respondJson(res, 200, send)
    })
      .catch(function (err) {
        restServer.respond(res, err)
      })
  })

  /**
    * @apiDescription Updates the Network Type record with the specified
    *      id.
    *
    * @api {put} /api/networkTypes/:id Update Network Type
    * @apiGroup Network Types
    * @apiPermission System Admin
    * @apiHeader {String} Authorization The Create Session's returned token
    *      prepended with "Bearer "
    * @apiParam (URL Parameters) {Number} id The Network Type's id
    * @apiParam (Request Body) {String} name The Network Type's name
    * @apiExample {json} Example body:
    *      {
    *          "name": "NB-IoT"
    *      }
    * @apiVersion 0.1.0
     */
  app.put('/api/networkTypes/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdminCompany],
  function (req, res, next) {
    var data = {}
    data.id = parseInt(req.params.id)
    // We'll start by getting the old record, as a read is much less
    // expensive than a write, and then we'll be able to tell if anything
    // really changed before we even try to write.
    modelAPI.networkTypes.load(req.params.id).then(function (rp) {
      // Fields that may exist in the request body that can change.  Make
      // sure they actually differ, though.
      var changed = 0
      if ((req.body.name) &&
                 (req.body.name !== rp.name)) {
        data.name = req.body.name
        ++changed
      }

      // Ready.  DO we have anything to actually change?
      if (changed === 0) {
        // No changes.  But returning 304 apparently causes Apache to strip
        // CORS info, causing the browser to throw a fit.  So just say,
        // "Yeah, we did that.  Really.  Trust us."
        restServer.respond(res, 204)
      }
      else {
        // Do the update.
        modelAPI.networkTypes.update(data).then(function (rec) {
          restServer.respond(res, 204)
        })
          .catch(function (err) {
            restServer.respond(res, err)
          })
      }
    })
      .catch(function (err) {
        appLogger.log('Error getting networkType ' + data.id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
    * @apiDescription Deletes the Network Type record with the specified
    *      id.
    *
    * @api {delete} /api/networkTypes/:id Delete Network Type
    * @apiGroup Network Types
    * @apiPermission System Admin
    * @apiHeader {String} Authorization The Create Session's returned token
    *      prepended with "Bearer "
    * @apiParam (URL Parameters) {Number} id The Network Type's id
    * @apiVersion 0.1.0
     */
  app.delete('/api/networkTypes/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdminCompany],
  function (req, res, next) {
    var id = parseInt(req.params.id)
    modelAPI.networkTypes.remove(id).then(function () {
      restServer.respond(res, 204)
    })
      .catch(function (err) {
        appLogger.log('Error deleting networkType ' + id + ': ' + err)
        restServer.respond(res, err)
      })
  })
}
