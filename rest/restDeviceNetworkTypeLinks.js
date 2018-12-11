var appLogger = require('./lib/appLogger.js')
var restServer
var modelAPI

exports.initialize = function (app, server) {
  restServer = server
  modelAPI = server.modelAPI

  /*********************************************************************
     * DeviceNetworkTypeLinks API.
     ********************************************************************
    /**
     * Gets the deviceNetworkTypeLinks that are defined
     *
     * @api {get} /api/deviceNetworkTypeLinks Get Device Network Type Links
     * @apiGroup Device Network Type Links
     * @apiDescription Returns an array of the Device Network Type Links that
     *      match the options.
     * @apiPermission All, but only System Admins can see entries from other
     *      companies.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Query Parameters) {Number} [limit] The maximum number of
     *      records to return.  Use with offset to manage paging.  0 is the
     *      same as unspecified, returning all users that match other query
     *      parameters.
     * @apiParam (Query Parameters) {Number} [offset] The offset into the
     *      returned database query set.  Use with limit to manage paging.  0 is
     *      the same as unspecified, returning the list from the beginning.
     * @apiParam (Query Parameters) {Number} [deviceId] Limit the records
     *      to those that have the deviceId specified.
     * @apiParam (Query Parameters) {Number} [applicationId] Limit the records
     *      to those that have the applicationId specified.
     * @apiParam (Query Parameters) {Number} [networkTypeId] Limit the records
     *      to those that have the networkTypeId specified.
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.totalCount The total number of records that
     *      would have been returned if offset and limit were not specified.
     *      This allows for calculation of number of "pages" of data.
     * @apiSuccess {Object[]} object.records An array of Device Network Type
     *      Links records.
     * @apiSuccess {Number} object.records.id The Device Network Type Link's Id
     * @apiSuccess {Number} object.records.deviceId The Device the record is
     *      linking to the Network Type.
     * @apiSuccess {Number} object.records.networkTypeId The Network Type
     *      that the Device is being linked to.
     * @apiSuccess {String} object.records.networkSettings The settings in a
     *      JSON string that correspond to the Network Type.
     * @apiVersion 0.1.0
     */
  app.get('/api/deviceNetworkTypeLinks', [restServer.isLoggedIn,
    restServer.fetchCompany], function (req, res, next) {
    var options = {}
    // Limit by company, too, if not a system admin.
    if (req.company.type != modelAPI.companies.COMPANY_ADMIN) {
      options.companyId = req.company.id
    }
    if (req.query.networkTypeId) {
      var networkTypeIdInt = parseInt(req.query.networkTypeId)
      if (!isNaN(networkTypeIdInt)) {
        options.networkTypeId = networkTypeIdInt
      }
    }
    if (req.query.deviceId) {
      var deviceIdInt = parseInt(req.query.deviceId)
      if (!isNaN(deviceIdInt)) {
        options.deviceId = deviceIdInt
      }
    }
    if (req.query.applicationId) {
      var applicationIdInt = parseInt(req.query.applicationId)
      if (!isNaN(applicationIdInt)) {
        options.applicationId = applicationIdInt
      }
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
    modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks(options).then(function (networks) {
      restServer.respondJson(res, null, networks)
    })
      .catch(function (err) {
        appLogger.log('Error getting networks: ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Gets the Devic Network Type Link record with the
     *      specified id.
     *
     * @api {get} /api/deviceNetworkTypeLinks/:id Get Device Network Type Link
     * @apiGroup Device Network Type Links
     * @apiPermission Any, but only System Admin can retrieve a Device Network
     *      Type Link other than one belonging to their own company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Device Network Type Link's id
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.id The Device Network Type Link's Id
     * @apiSuccess {Number} object.deviceId The Device the record is
     *      linking to the Network Type.
     * @apiSuccess {Number} object.networkTypeId The Network Type
     *      that the Device is being linked to.
     * @apiSuccess {String} object.networkSettings The settings in a
     *      JSON string that correspond to the Network Type.
     * @apiVersion 0.1.0
     */
  app.get('/api/deviceNetworkTypeLinks/:id', [restServer.isLoggedIn], function (req, res, next) {
    var id = parseInt(req.params.id)
    modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLink(id).then(function (np) {
      restServer.respondJson(res, null, np)
    })
      .catch(function (err) {
        appLogger.log('Error getting deviceNetworkTypeLink ' + id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Creates a new Device Network Type Link record.  Also
     *      creates the device on remote Networks of the Network Type.
     *
     * @api {post} /api/deviceNetworkTypeLinks Create Device Network Type Link
     * @apiGroup Device Network Type Links
     * @apiPermission System Admin
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Request Body) {Number} deviceId The Device the record is
     *      linking to the Network Type.
     * @apiParam (Request Body) {Number} networkTypeId The Network Type
     *      that the Device is being linked to.
     * @apiParam (Request Body) {String} networkSettings The settings in a
     *      JSON string that correspond to the Network Type.
     * @apiExample {json} Example body:
     *      {
     *          "deviceId": 2,
     *          "networkTypeId": 4,
     *          "networkSettings": "{ ... }",
     *      }
     * @apiSuccess {Number} id The new Device Network Type Link's id.
     * @apiVersion 0.1.0
     */
  app.post('/api/deviceNetworkTypeLinks', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var rec = req.body
    // You can't specify an id.
    if (rec.id) {
      restServer.respond(res, 400, "Cannot specify the deviceNetworkTypeLink's id in create")
      return
    }

    // Verify that required fields exist.
    if (!rec.deviceId ||
             !rec.deviceProfileId ||
             !rec.networkTypeId ||
             !rec.networkSettings) {
      restServer.respond(res, 400, 'Missing required data')
      return
    }

    // If the user is not a member of the admin company, send the company
    // ID of the user into the query to verify that the device belongs
    // to that company.
    var companyId
    if (modelAPI.companies.COMPANY_ADMIN !== req.company.type) {
      companyId = req.company.id
    }

    // Do the add.
    modelAPI.deviceNetworkTypeLinks.createDeviceNetworkTypeLink(
      rec.deviceId,
      rec.networkTypeId,
      rec.deviceProfileId,
      rec.networkSettings,
      companyId).then(function (rec) {
      var send = {}
      send.id = rec.id
      send.remoteAccessLogs = rec.remoteAccessLogs
      restServer.respondJson(res, 200, send)
    })
      .catch(function (err) {
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Updates the Device Network Type Link record with the
     *      specified id.  Also pushes changes to remote Networks of the Network
     *      Type.
     *
     * @api {put} /api/deviceNetworkTypeLinks/:id
     *      Update Device Network Type Link
     * @apiGroup Device Network Type Links
     * @apiPermission System Admin
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Device Network Type Link's id
     * @apiParam (Request Body) {String} [networkSettings] The settings in a
     *      JSON string that correspond to the Network Type.
     * @apiExample {json} Example body:
     *      {
     *          "networkSettings": "{ ... }",
     *      }
     * @apiVersion 0.1.0
     */
  app.put('/api/deviceNetworkTypeLinks/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    // We're not going to allow changing the device or the network.
    // Neither operation makes much sense.
    if (req.body.deviceId || req.body.networkTypeId) {
      restServer.respond(res, 400, 'Cannot change link targets')
      return
    }

    var data = {}
    data.id = parseInt(req.params.id)
    // We'll start by getting the network, as a read is much less expensive
    // than a write, and then we'll be able to tell if anything really
    // changed before we even try to write.
    modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLink(data.id).then(function (dnl) {
      // Fields that may exist in the request body that can change.  Make
      // sure they actually differ, though.
      var changed = 0
      if (req.body.networkSettings) {
        if (req.body.networkSettings != dnl.networkSettings) {
          data.networkSettings = req.body.networkSettings
          ++changed
        }
      }

      // Ready.  DO we have anything to actually change?
      if (changed == 0) {
        // No changes.  But returning 304 apparently causes Apache to strip
        // CORS info, causing the browser to throw a fit.  So just say,
        // "Yeah, we did that.  Really.  Trust us."
        restServer.respond(res, 204)
      }
      else {
        // If not an admin company, the deviceId better be
        // associated  with the user's company
        var companyId
        if (req.company.type !== modelAPI.companies.COMPANY_ADMIN) {
          companyId = req.user.companyId
        }

        // Do the update.
        modelAPI.deviceNetworkTypeLinks.updateDeviceNetworkTypeLink(data, companyId).then(function (rec) {
          restServer.respondJson(res, 204, { remoteAccessLogs: rec.remoteAccessLogs })
        })
          .catch(function (err) {
            restServer.respond(res, err)
          })
      }
    })
      .catch(function (err) {
        appLogger.log('Error getting deviceNetworkTypeLink ' + data.id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Deletes the Device Network Type Links record with the
     *      specified id.  Also deletes the Device from remote Networks of the
     *      Network Type.
     *
     * @api {delete} /api/deviceNetworkTypeLinks/:id
     *      Delete Device Network Type Link
     * @apiGroup Device Network Type Links
     * @apiPermission System Admin
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Device Network Type Link's id
     * @apiVersion 0.1.0
     */
  app.delete('/api/deviceNetworkTypeLinks/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var id = parseInt(req.params.id)
    // If not an admin company, the deviceId better be associated
    // with the user's company
    var companyId
    if (req.company.type !== modelAPI.companies.COMPANY_ADMIN) {
      companyId = req.user.companyId
    }

    modelAPI.deviceNetworkTypeLinks.deleteDeviceNetworkTypeLink(id, companyId).then(function (rec) {
      restServer.respond(res, 204, { remoteAccessLogs: rec.remoteAccessLogs })
    })
      .catch(function (err) {
        appLogger.log('Error deleting deviceNetworkTypeLink ' + id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Pushes the Device Network Type Links record with the
     *      specified id.
     * @api {post} /api/deviceNetworkTypeLinks/:id/push
     *      Push Device Network Type Link
     * @apiGroup Device Network Type Links
     * @apiPermission System Admin or Company Admin for the Device's Company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Device Network Type Link's id
     * @apiVersion 0.1.0
     */
  app.post('/api/deviceNetworkTypeLinks/:id/push', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin,
    modelAPI.devices.fetchDeviceApplication],
  function (req, res, next) {
    var id = parseInt(req.params.id)
    // If the caller is a global admin, or the device is part of the company
    // admin's company, we can delete.
    if ((req.company.type === modelAPI.companies.COMPANY_ADMIN) ||
                (req.application.companyId === req.user.companyId)) {
      modelAPI.deviceNetworkTypeLinks.pushDeviceNetworkTypeLink(id, req.application.companyId).then(function (ret) {
        restServer.respond(res, 204, ret)
      })
    }
    // Device is owned by another company.
    else {
      appLogger.log("Someone else's device")
      restServer.respond(res, 403, "Cannot delete another company's device.")
    }
  })
}
