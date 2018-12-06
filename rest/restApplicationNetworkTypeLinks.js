var appLogger = require('./lib/appLogger.js')
var restServer
var modelAPI

exports.initialize = function (app, server) {
  restServer = server
  modelAPI = server.modelAPI

  /*********************************************************************
     * ApplicationNetworkTypeLinks API.
     ********************************************************************
    /**
     * Gets the applicationNetworkTypeLinks that are defined
     *
     * @api {get} /api/applicationNetworkTypeLinks
     *      Get Application Network Type Links
     * @apiGroup Application Network Type Links
     * @apiDescription Returns an array of the Application Network Type Links
     *      that match the options.
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
     * @apiParam (Query Parameters) {Number} [companyId] Limit the records
     *      to those whose application are part of the Company.
     * @apiParam (Query Parameters) {Number} [applicationId] Limit the records
     *      to those that have the applicationId specified.
     * @apiParam (Query Parameters) {Number} [networkTypeId] Limit the records
     *      to those that have the networkTypeId specified.
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.totalCount The total number of records that
     *      would have been returned if offset and limit were not specified.
     *      This allows for calculation of number of "pages" of data.
     * @apiSuccess {Object[]} object.records An array of Application Network
     *      Type Links records.
     * @apiSuccess {Number} object.records.id The Application Network Type
     *      Link's Id
     * @apiSuccess {Number} object.records.applicationId The Application the
     *      record is linking to the Network Type.
     * @apiSuccess {Number} object.records.networkTypeId The Network Type
     *      that the Application is being linked to.
     * @apiSuccess {String} object.records.networkSettings The settings in a
     *      JSON string that correspond to the Network Type.
     * @apiVersion 0.1.0
     */
  app.get('/api/applicationNetworkTypeLinks', [restServer.isLoggedIn,
    restServer.fetchCompany],
  function (req, res, next) {
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
    if (req.query.applicationId) {
      var applicationIdInt = parseInt(req.query.applicationId)
      if (!isNaN(applicationIdInt)) {
        options.applicationId = applicationIdInt
      }
    }
    if (req.query.companyId) {
      var companyIdInt = parseInt(req.query.companyId)
      if (!isNaN(companyIdInt)) {
        options.companyId = companyIdInt
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
    modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLinks(options).then(function (networkTypes) {
      restServer.respondJson(res, null, networkTypes)
    })
      .catch(function (err) {
        appLogger.log('Error getting networkTypes: ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Gets the applicationNetworkTypeLink record with the
     * specified id.
     *
     * @api {get} /api/applicationNetworkTypeLinks/:id
     *      Get Application Network Type Link
     * @apiGroup Application Network Type Links
     * @apiPermission Any, but only System Admin can retrieve a Application
     *      Network Type Link other than one belonging to their own Company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Application Network Type
     *      Link's id
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.id The Application Network Type Link's Id
     * @apiSuccess {Number} object.applicationId The Application the record is
     *      linking to the Network Type.
     * @apiSuccess {Number} object.networkTypeId The Network Type
     *      that the Application is being linked to.
     * @apiSuccess {String} object.networkSettings The settings in a
     *      JSON string that correspond to the Network Type.
     * @apiVersion 0.1.0
     */
  app.get('/api/applicationNetworkTypeLinks/:id', [restServer.isLoggedIn], function (req, res, next) {
    var id = parseInt(req.params.id)
    modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLink(id).then(function (np) {
      restServer.respondJson(res, null, np)
    })
      .catch(function (err) {
        appLogger.log('Error getting applicationNetworkTypeLink ' + id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Creates a new applicationNetworkTypeLink record.  Also
     *      creates the Application on the remote Networks of the Network Type.
     *
     * @api {post} /api/applicationNetworktypeLinks
     *      Create Application Network Type Link
     * @apiGroup Application Network Type Links
     * @apiPermission System Admin, or the Company Admin that the Application
     *      belongs to.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Request Body) {Number} applicationId The Application the
     *      record is linking to the Network Type.
     * @apiParam (Request Body) {Number} networkTypeId The Network Type
     *      that the Application is being linked to.
     * @apiParam (Request Body) {String} networkSettings The settings in a
     *      JSON string that correspond to the Network Type.
     * @apiExample {json} Example body:
     *      {
     *          "applicationId": 1,
     *          "networkTypeId": 4,
     *          "networkSettings": "{ ... }",
     *      }
     * @apiSuccess {Number} id The new Application Network Type Link's id.
     * @apiVersion 0.1.0
     */
  app.post('/api/applicationNetworkTypeLinks', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var rec = req.body
    // You can't specify an id.
    if (rec.id) {
      restServer.respond(res, 400, "Cannot specify the applicationNetworkTypeLink's id in create")
      return
    }

    // Verify that required fields exist.
    if (!rec.applicationId || !rec.networkTypeId || !rec.networkSettings) {
      restServer.respond(res, 400, 'Missing required data')
      return
    }

    // If the user is not a member of the admin company, send the company
    // ID of the user into the query to verify that the application belongs
    // to that company.
    var companyId
    if (modelAPI.companies.COMPANY_ADMIN !== req.company.type) {
      companyId = req.company.id
    }

    // Do the add.
    modelAPI.applicationNetworkTypeLinks.createApplicationNetworkTypeLink(
      rec.applicationId,
      rec.networkTypeId,
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
     * @apiDescription Updates the applicationNetworkTypeLink record with the
     * specified id.  Also pushes changes to the remote Networks of the Network
     * Type.
     *
     * @api {put} /api/applicationNetworkTypeLinks/:id
     *      Update Application Network Type Link
     * @apiGroup Application Network Type Links
     * @apiPermission System Admin or a Company Admin for a Company the
     *      Application belongs to.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Application Network Type
     *      Link's id
     * @apiParam (Request Body) {String} [networkSettings] The settings in a
     *      JSON string that correspond to the Network Type.
     * @apiExample {json} Example body:
     *      {
     *          "networkSettings": "{ ... }",
     *      }
     * @apiVersion 0.1.0
     */
  app.put('/api/applicationNetworkTypeLinks/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    // We're not going to allow changing the application or the network.
    // Neither operation makes much sense.
    if (req.body.applicationId || req.body.networkTypeId) {
      restServer.respond(res, 400, 'Cannot change link targets')
      return
    }

    var data = {}
    data.id = parseInt(req.params.id)
    // We'll start by getting the network, as a read is much less expensive
    // than a write, and then we'll be able to tell if anything really
    // changed before we even try to write.
    modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLink(data.id).then(function (anl) {
      // Fields that may exist in the request body that can change.  Make
      // sure they actually differ, though.
      var changed = 0
      if (req.body.networkSettings) {
        if (req.body.networkSettings !== anl.networkSettings) {
          data.networkSettings = req.body.networkSettings
          ++changed
        }
      }

      // Ready.  Do we have anything to actually change?
      if (changed == 0) {
        // No changes.  But returning 304 apparently causes Apache to strip
        // CORS info, causing the browser to throw a fit.  So just say,
        // "Yeah, we did that.  Really.  Trust us."
        restServer.respond(res, 204)
      }
      else {
        // Do the update.
        // TODO: Get rid of companies.  For now it is always 2 HACK
        let companyId = 2
        modelAPI.applicationNetworkTypeLinks.updateApplicationNetworkTypeLink(data, companyId).then(function (rec) {
          restServer.respondJson(res, 200, { remoteAccessLogs: rec.remoteAccessLogs })
        })
          .catch(function (err) {
            restServer.respond(res, err)
          })
      }
    })
      .catch(function (err) {
        appLogger.log('Error getting applicationNetworkTypeLink ' + data.id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Deletes the applicationNetworkTypeLinks record with the
     *      specified id.  Also deletes the Application on the remote Networks
     *      of the Network Type.
     *
     * @api {delete} /api/applicationNetworkTypeLinks/:id
     *      Delete Application Network Type Link
     * @apiGroup Application Network Type Links
     * @apiPermission System Admin or the Company Admin for the company that the
     *      Application belongs to.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Application Network Type
     *      Link's id
     * @apiVersion 0.1.0
     */
  app.delete('/api/applicationNetworkTypeLinks/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var id = parseInt(req.params.id)
    // If not an admin company, the applicationId better be associated
    // with the user's company.  We check that in the delete method.
    var companyId
    if (req.company.type !== modelAPI.companies.COMPANY_ADMIN) {
      companyId = req.user.companyId
    }

    modelAPI.applicationNetworkTypeLinks.deleteApplicationNetworkTypeLink(id, companyId).then(function (ret) {
      restServer.respondJson(res, 200, { remoteAccessLogs: ret.remoteAccessLogs })
    })
      .catch(function (err) {
        appLogger.log('Error deleting applicationNetworkTypeLink ' + id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * Pushes the applicationNetworkTypeLinks record with the specified id.
     * - Only a user with the admin company or the admin of the device's
     *   company can delete an device. TODO: Is this true?
     */
  app.post('/api/applicationNetworkTypeLinks/:id/push', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var id = parseInt(req.params.id)
    // If the caller is a global admin, or the device is part of the company
    // admin's company, we can push.
    modelAPI.applicationNetworkTypeLinks.pushApplicationNetworkTypeLink(id, req.company.id).then(function (ret) {
      restServer.respond(res, 200, ret)
    }).catch(function (err) {
      appLogger.log('Error pushing applicationNetworkTypeLink ' + id + ': ' + err)
      restServer.respond(res, err)
    })
  })
}
