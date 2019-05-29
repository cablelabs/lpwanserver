var appLogger = require('./lib/appLogger.js')
var restServer
var modelAPI

const { formatRelationshipsOut } = require('./lib/prisma')

exports.initialize = function (app, server) {
  restServer = server
  modelAPI = server.modelAPI

  /*********************************************************************
    * DeviceProfiles API
    ********************************************************************/
  /**
     * Gets the deviceProfiles available for access by the calling account..
     *
     * @api {get} /api/deviceProfiles Get Device Profiles
     * @apiGroup Device Profiles
     * @apiDescription Returns an array of the Device Profiles that match the
     *      options.
     * @apiPermission System Admin accesses all Device Profiles, others access
     *       only their own Company's Device Profiles.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Query Parameters) {Number} [limit] The maximum number of
     *      records to return.  Use with offset to manage paging.  0 is the
     *      same as unspecified, returning all users that match other query
     *      parameters.
     * @apiParam (Query Parameters) {Number} [offset] The offset into the
     *      returned database query set.  Use with limit to manage paging.  0 is
     *      the same as unspecified, returning the list from the beginning.
     * @apiParam (Query Parameters) {String} [search] Search the Device Profiles
     *      based on name matches to the passed string.  In the string, use "%"
     *      to match 0 or more characters and "_" to match exactly one.  For
     *      example, to match names starting with "D", use the string "D%".
     * @apiParam (Query Parameters) {Number} [companyId] Limit the Device
     *      Profiles to those belonging to the Company.
     * @apiParam (Query Parameters) {Number} [networkTypeId] Limit the
     *      Device Profiles to those that are for the Network Type.
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.totalCount The total number of records that
     *      would have been returned if offset and limit were not specified.
     *      This allows for calculation of number of "pages" of data.
     * @apiSuccess {Object[]} object.records An array of Device Profile records.
     * @apiSuccess {Number} object.records.id The Device Profile's Id
     * @apiSuccess {String} object.records.name The Device Profile's name
     * @apiSuccess {String} object.records.description The Device Profile's
     *      description
     * @apiSuccess {Number} object.records.companyId The Id of the Company that
     *      the Device Profile belongs to.
     * @apiSuccess {Number} object.records.networkTypeId The Network Type that
     *      this Device Profile works with.
     * @apiSuccess {Object} object.records.networkSettings The JSON data
     *      structure that has the settings for the Network Type.  This is
     *      expected to match the Network Protocol's expected data used to
     *      set up the device on the remote Network(s).
     */
  app.get('/api/deviceProfiles', [ restServer.isLoggedIn,
    restServer.fetchCompany ],
  function (req, res, next) {
    var options = {}
    // Make sure the caller is admin or part of the company.
    if (req.company.type !== 'ADMIN') {
      if (req.query.companyId) {
        var coidInt = req.query.companyId
        if (!isNaN(coidInt)) {
          if (coidInt !== req.user.company.id) {
            restServer.respond(res, 403, 'Cannot request deviceProfiles for another company')
            return
          }
          else {
            // Pass the restriction along
            options.companyId = coidInt
          }
        }
        else {
          restServer.respond(res, 403, 'Bad companyId in query')
          return
        }
      }
      else {
        // Force the search to be limited to the user's company anyway.
        options.companyId = req.user.company.id
      }
    }

    if (options.companyId) {
      options.companyId = options.companyId
    }

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

    modelAPI.deviceProfiles.list(options).then(function (dps) {
      const responseBody = { ...dps, records: dps.records.map(formatRelationshipsOut) }
      restServer.respondJson(res, null, responseBody)
    })
      .catch(function (err) {
        appLogger.log('Error getting deviceProfiles: ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Gets the Device Profile record with the specified id.
     *
     * @api {get} /api/deviceProfile/:id Get Device Profile
     * @apiGroup Device Profiles
     * @apiPermission Any, but only System Admin can retrieve a Device Profile
     *      that is not owned by their Company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Device Profile's id
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.id The Device Profile's Id
     * @apiSuccess {String} object.name The Device Profile's name
     * @apiSuccess {String} object.description The Device Profile's description
     * @apiSuccess {Number} object.companyId The Id of the Company that
     *      the Device Profile belongs to.
     * @apiSuccess {Number} object.networkTypeId The Network Type that
     *      this Device Profile works with.
     * @apiSuccess {Object} object.networkSettings The JSON data
     *      structure that has the settings for the Network Type.  This is
     *      expected to match the Network Protocol's expected data used to
     *      set up the device on the remote Network(s).
     * @apiVersion 0.1.0
     */
  app.get('/api/deviceProfiles/:id', [ restServer.isLoggedIn,
    restServer.fetchCompany ],
  function (req, res, next) {
    // Need the device record to see if it's OK to return for non-admin
    // user.  (Admin user can get all, so we need to do this anyway.)
    let { id } = req.params
    modelAPI.deviceProfiles.load(id).then(function (dp) {
      if ((req.company.type !== 'ADMIN') &&
                 (dp.company.id !== req.user.company.id)) {
        restServer.respond(res, 403)
      }
      else {
        restServer.respondJson(res, null, formatRelationshipsOut(dp))
      }
    })
      .catch(function (err) {
        restServer.respondJson(res, err)
      })
  })

  /**
     * @apiDescription Creates a new Device Profile record.  Also creates a
     *      Device Profile on remote Networks of the Network Type, where
     *      supported.
     *
     * @api {post} /api/deviceProfiles Create Device Profile
     * @apiGroup Device Profiles
     * @apiPermission System Admin, or Company Admin that can only create a
     *         Device Profile for their own company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Request Body) {String} object.name The Device Profile's name
     * @apiParam (Request Body) {String} object.description The Device
     *      Profile's description
     * @apiParam (Request Body) {Number} object.companyId The Id of the Company
     *      that the Device Profile belongs to.
     * @apiParam (Request Body) {Number} object.networkTypeId The Network Type
     *      that this Device Profile works with.
     * @apiParam (Request Body) {Object} object.networkSettings The JSON data
     *      structure that has the settings for the Network Type.  This is
     *      expected to match the Network Protocol's expected data used to
     *      set up the device on the remote Network(s).
     * @apiExample {json} Example body:
     *      {
     *          "name": "GPS Tracker",
     *          "description": "GPS device for remote reporting",
     *          "companyId": 1,
     *          "networkTypeId": 1,
     *          "networkSettings": {...}
     *      }
     * @apiSuccess {Number} id The new Device Profile's id.
     * @apiVersion 0.1.0
     */
  app.post('/api/deviceProfiles', [ restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin ],
  function (req, res, next) {
    var rec = req.body
    // You can't specify an id.
    if (rec.id) {
      restServer.respond(res, 400, "Cannot specify the deviceProfiles's id in create")
      return
    }

    // Verify that required fields exist.
    if (!rec.name ||
             !rec.description ||
             !rec.networkTypeId ||
             !rec.companyId ||
             !rec.networkSettings) {
      restServer.respond(res, 400, 'Missing required data')
      return
    }

    // The user must be part of the admin group or the deviceProfile's
    // company.
    if ((modelAPI.companies.COMPANY_ADMIN !== req.company.type.id) &&
             (rec.companyId !== req.user.company.id)) {
      restServer.respond(res, 403, "Can't create a deviceProfile for another company's application")
    }
    else {
      // OK, add it.
      modelAPI.deviceProfiles.create(
        rec.networkTypeId,
        rec.companyId,
        rec.name,
        rec.description,
        rec.networkSettings).then(function (rec) {
        var send = {}
        send.id = rec.id
        send.remoteAccessLogs = rec.remoteAccessLogs
        restServer.respondJson(res, 200, send)
      })
        .catch(function (err) {
          appLogger.log('Failed to create deviceProfile ' + JSON.stringify(rec) + ': ' + err)
          restServer.respondJson(res, err)
        })
    }
  })

  /**
     * @apiDescription Updates the Device Profile record with the specified id.
     *      Also pushes updates to remote Networks of the Network Type that
     *      support the concept of Device Profiles.
     *
     * @api {put} /api/deviceProfiles/:id Update Device Profile
     * @apiGroup Device Profiles
     * @apiPermission System Admin, or Company Admin for this Company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Request Body) {String} [name] The Device Profile's name
     * @apiParam (Request Body) {String} [description] The Device Profile's
     *      description
     * @apiParam (Request Body) {Number} [companyId] The Id of the Company
     *      that the Device Profile belongs to.
     * @apiParam (Request Body) {Number} [networkTypeId] The Network Type
     *      that this Device Profile works with.
     * @apiParam (Request Body) {Object} [networkSettings] The JSON data
     *      structure that has the settings for the Network Type.  This is
     *      expected to match the Network Protocol's expected data used to
     *      set up the device on the remote Network(s).
     * @apiExample {json} Example body:
     *      {
     *          "name": "GPS Tracker",
     *          "description": "GPS tracker with remote reporting",
     *          "companyId": 1,
     *          "networkTypeId": 1,
     *          "networkSettings": {...}
     *      }
     * @apiVersion 0.1.0
     */
  app.put('/api/deviceProfiles/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var data = { id: req.params.id }
    // Start by getting the original deviceProfile to check for changes.
    modelAPI.deviceProfiles.load(data.id).then(function (dp) {
      // Verify that the user can make the change.
      if ((modelAPI.companies.COMPANY_ADMIN !== req.company.type.id) &&
                 (req.user.company.id !== dp.company.id)) {
        respond(res, 403)
        return
      }

      var changed = 0
      if ((req.body.name) &&
                 (req.body.name !== dp.name)) {
        data.name = req.body.name
        ++changed
      }

      if ((req.body.description) &&
                 (req.body.description !== dp.description)) {
        data.description = req.body.description
        ++changed
      }

      if ((req.body.networkTypeId) &&
                 (req.body.networkTypeId !== dp.networkType.id)) {
        data.networkTypeId = req.body.networkTypeId
        ++changed
      }

      if ((req.body.companyId) &&
                 (req.body.companyId !== dp.company.id)) {
        data.companyId = req.body.companyId
        ++changed
      }

      if ((req.body.networkSettings) &&
                 (req.body.networkSettings !== dp.networkSettings)) {
        data.networkSettings = req.body.networkSettings
        ++changed
      }

      // Do we have a change?
      if (changed === 0) {
        // No changes.  But returning 304 apparently causes Apache to
        // strip CORS info, causing the browser to throw a fit.  So
        // just say, "Yeah, we did that.  Really.  Trust us."
        restServer.respond(res, 204)
      }
      else {
        // Do the update.
        modelAPI.deviceProfiles.update(data).then(function (rec) {
          restServer.respondJson(res, 204, { remoteAccessLogs: rec.remoteAccessLogs })
        })
          .catch(function (err) {
            appLogger.log('Failed to update deviceProfile ' + data.id + ' with ' + JSON.stringify(data) + ': ' + err)
            restServer.respond(res, err)
          })
      }
    })
      .catch(function (err) {
        appLogger.log('Failed to retrieve deviceProfile ' + data.id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Deletes the Device Profile record with the specified id.
     *      Also deletes the Device Profile from remote Networks of the Network
     *      Type, where the concept of a Device Profile is supported.
     *
     * @api {delete} /api/deviceProfiles/:id Delete Device Profile
     * @apiGroup Device Profiles
     * @apiPermission System Admin, or Company Admin for this company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Device Profile's id
     * @apiVersion 0.1.0
     */
  app.delete('/api/deviceProfiles/:id', [ restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin ],
  function (req, res, next) {
    let { id } = req.params
    // with the user's company.  We check that in the delete method.
    var companyId = null
    if (req.company.type !== 'ADMIN') {
      companyId = req.user.company.id
    }

    modelAPI.deviceProfiles.remove(id, companyId).then(function (ret) {
      restServer.respondJson(res, 200, { remoteAccessLogs: ret.remoteAccessLogs })
    })
      .catch(function (err) {
        appLogger.log('Error deleting deviceProfile ' + id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Pushes the Device Profile record with the specified id.
     *
     * @api {post} /api/deviceProfiles/:id/push Push Device Profile
     * @apiGroup Device Profiles
     * @apiPermission System Admin, or Company Admin for this company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Device Profile's id
     * @apiVersion 0.1.0
     */
  app.post('/api/deviceProfiles/:id/push', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    let { id } = req.params
    // with the user's company.  We check that in the push method.
    var companyId = null
    if (req.company.type !== 'ADMIN') {
      companyId = req.user.company.id
    }

    modelAPI.deviceProfiles.pushDeviceProfile(id, companyId).then(function (ret) {
      restServer.respond(res, 200, ret)
    })
      .catch(function (err) {
        appLogger.log('Error pushing deviceProfile ' + id + ': ' + err)
        restServer.respond(res, err)
      })
  })
}
