var appLogger = require('./lib/appLogger.js')
var restServer
var modelAPI

exports.initialize = function (app, server) {
  restServer = server
  modelAPI = server.modelAPI

  /*********************************************************************
    * Applications API
    ********************************************************************/
  /**
     * Gets the applications available for access by the calling account.
     *
     * @api {get} /api/applications Get Applications
     * @apiGroup Applications
     * @apiDescription Returns an array of the Applications that match the
     *      options.
     * @apiPermission System Admin accesses all Applications, others access
     *       only their own Company's Applications.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Query Parameters) {Number} [limit] The maximum number of
     *      records to return.  Use with offset to manage paging.  0 is the
     *      same as unspecified, returning all users that match other query
     *      parameters.
     * @apiParam (Query Parameters) {Number} [offset] The offset into the
     *      returned database query set.  Use with limit to manage paging.  0 is
     *      the same as unspecified, returning the list from the beginning.
     * @apiParam (Query Parameters) {String} [search] Search the Applications
     *      based on name matches to the passed string.  In the string, use "%"
     *      to match 0 or more characters and "_" to match exactly one.  For
     *      example, to match names starting with "D", use the string "D%".
     * @apiParam (Query Parameters) {Number} [companyId] Limit the Applications
     *      to those belonging to the Company.
     * @apiParam (Query Parameters) {Number} [reportingProtocolId] Limit the
     *      Applications to those that use the Reporting Protocol.
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.totalCount The total number of records that
     *      would have been returned if offset and limit were not specified.
     *      This allows for calculation of number of "pages" of data.
     * @apiSuccess {Object[]} object.records An array of Application records.
     * @apiSuccess {Number} object.records.id The Application's Id
     * @apiSuccess {String} object.records.name The Application's name
     * @apiSuccess {String} object.records.description The Application's
     *      description
     * @apiSuccess {Number} object.records.companyId The Id of the Company
     *      that the Application belongs to.
     * @apiSuccess {String} object.records.baseUrl The base URL used by the
     *      Reporting Protocol
     * @apiSuccess {Number} object.records.reportingProtocolId The
     *      Id of the Reporting Protocol used by the Application.
     * @apiSuccess {Boolean} object.records.running If the Application is
     *      currently sending data received from the Networks to the baseUrl via
     *      the Reporting Protocol.
     * @apiVersion 0.1.0
     */
  app.get('/api/applications', [restServer.isLoggedIn,
    restServer.fetchCompany],
  function (req, res, next) {
    var options = {}
    if (req.company.type !== modelAPI.companies.COMPANY_ADMIN) {
      // If they gave a companyId, make sure it's their own.
      if (req.query.companyId) {
        if (req.query.companyId !== req.user.companyId) {
          restServer.respond(res, 403, 'Cannot request applications for another company')
          return
        }
      }
      else {
        // Force the search to be limited to the user's company
        options.companyId = req.user.companyId
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
    if (req.query.search) {
      options.search = req.query.search
    }
    // This may be redundant, but we've already verified that if the
    // user is not part of the admin company, then this is their companyId.
    if (req.query.companyId) {
      options.companyId = req.query.companyId
    }
    if (req.query.reportingProtocolId) {
      options.reportingProtocolId = req.query.reportingProtocolId
    }
    if (req.query.networkProtocolId) {
      options.networkProtocolId = req.query.networkProtocolId
    }
    modelAPI.applications.retrieveApplications(options).then(function (cos) {
      restServer.respondJson(res, null, cos)
    })
      .catch(function (err) {
        appLogger.log('Error getting applications: ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Gets the Application record with the specified id.
     *
     * @api {get} /api/applications/:id Get Application
     * @apiGroup Applications
     * @apiPermission Any, but only System Admin can retrieve an Application
     *      that is not owned by their Company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Application's id
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.id The Application's Id
     * @apiSuccess {String} object.name The Application's name
     * @apiSuccess {String} object.description The Application's description
     * @apiSuccess {Number} object.companyId The Id of the Company
     *      that the Application belongs to.
     * @apiSuccess {String} object.baseUrl The base URL used by the
     *      Reporting Protocol
     * @apiSuccess {Number} object.reportingProtocolId The
     *      Id of the Reporting Protocol used by the Application.
     * @apiSuccess {Boolean} object.running If the Application is
     *      currently sending data received from the Networks to the baseUrl via
     *      the Reporting Protocol.
     * @apiVersion 0.1.0
     */
  app.get('/api/applications/:id', [restServer.isLoggedIn,
    restServer.fetchCompany],
  function (req, res, next) {
    modelAPI.applications.retrieveApplication(parseInt(req.params.id)).then(function (app) {
      if ((req.company.type !== modelAPI.companies.COMPANY_ADMIN) &&
                 (app.companyId !== req.user.companyId)) {
        restServer.respond(res, 403)
      }
      else {
        restServer.respondJson(res, null, app)
      }
    })
      .catch(function (err) {
        appLogger.log('Error getting application ' + req.params.id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Creates a new application record.
     *
     * @api {post} /api/applications Create Application
     * @apiGroup Applications
     * @apiPermission System Admin or Company Admin
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Request Body) {String} name The Application's name
     * @apiParam (Request Body) {String} description The Application's
     *      description
     * @apiParam (Request Body) {Number} companyId The Id of the Company that
     *      the Application blongs to.  For a Company Admin user, this can
     *      only be the Id of their own Company.
     * @apiParam (Request Body) {String} baseURL The URL that the Reporting
     *      Protocol sends the data to.  This may have additional paths added,
     *      depending on the Reporting Protocol.
     * @apiParam (Request Body) {Number} reportingProtocolId The Id of the
     *      Reporting Protocol the Application will use to pass Device data
     *      back to the Application Vendor.
     * @apiExample {json} Example body:
     *      {
     *          "name": "GPS Pet Tracker",
     *          "description": "Pet finder with occasional reporting",
     *          "companyId": 1,
     *          "baseUrl": "https://IoTStuff.com/incomingData/GPSPetTracker"
     *          "reportingProtocolId": 1
     *      }
     * @apiSuccess {Number} id The new Application's id.
     * @apiVersion 0.1.0
     */
  app.post('/api/applications', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var rec = req.body
    // You can't specify an id.
    if (rec.id) {
      restServer.respond(res, 400, "Cannot specify the applocation's id in create")
      return
    }

    // Verify that required fields exist.
    if (!rec.name || !rec.description || !rec.companyId || !rec.reportingProtocolId || !rec.baseUrl) {
      restServer.respond(res, 400, 'Missing required data')
      return
    }

    // The user must be part of the admin group or the target company.
    if ((modelAPI.companies.COMPANY_ADMIN !== req.company.type) &&
            (req.user.companyId !== rec.companyId)) {
      restServer.respond(res, 403)
      return
    }

    // Do the add.
    modelAPI.applications.createApplication(rec.name,
      rec.description,
      rec.companyId,
      rec.reportingProtocolId,
      rec.baseUrl).then(function (rec) {
      var send = {}
      send.id = rec.id
      restServer.respondJson(res, 200, send)
    })
      .catch(function (err) {
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Updates the application record with the specified id.
     *
     * @api {put} /api/applications/:id Update Application
     * @apiGroup Applications
     * @apiPermission System Admin, or Company Admin for this Company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Application's id
     * @apiParam (Request Body) {String} [name] The Application's name
     * @apiParam (Request Body) {String} [description] The Application's
     *      description
     * @apiParam (Request Body) {Number} [companyId] The Id of the Company that
     *      the Application blongs to.  For a Company Admin user, this can
     *      only be the Id of their own Company.
     * @apiParam (Request Body) {String} [baseURL] The URL that the Reporting
     *      Protocol sends the data to.  This may have additional paths added,
     *      depending on the Reporting Protocol.
     * @apiParam (Request Body) {Number} [reportingProtocolId] The Id of the
     *      Reporting Protocol the Application will use to pass Device data
     *      back to the Application Vendor.
     * @apiExample {json} Example body:
     *      {
     *          "name": "GPS Pet Tracker",
     *          "description": "Pet finder with occasional reporting"
     *          "companyId": 1,
     *          "baseUrl": "https://IoTStuff.com/incomingData/GPSPetTracker"
     *          "reportingProtocolId": 1
     *      }
     * @apiVersion 0.1.0
     */
  app.put('/api/applications/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var data = {}
    data.id = parseInt(req.params.id)
    // We'll start by getting the application, as a read is much less
    // expensive than a write, and then we'll be able to tell if anything
    // really changed before we even try to write.
    modelAPI.applications.retrieveApplication(data.id).then(function (app) {
      // Verify that the user can make the change.
      if ((modelAPI.companies.COMPANY_ADMIN !== req.company.type) &&
                 (req.user.companyId !== app.companyId)) {
        restServer.respond(res, 403)
        return
      }

      var changed = 0
      if ((req.body.name) &&
                 (req.body.name !== app.name)) {
        data.name = req.body.name
        ++changed
      }

      if ((req.body.description) &&
                 (req.body.description !== app.description)) {
        data.description = req.body.description
        ++changed
      }

      // Can only change the companyId if an admin user.
      if ((req.body.companyId) &&
                 (req.body.companyId !== app.companyId) &&
                 (modelAPI.companies.COMPANY_ADMIN !== req.company.type)) {
        restServer.respond(res, 400, "Cannot change application's company")
        return
      }

      if ((req.body.companyId) &&
                 (req.body.companyId !== app.companyId)) {
        data.companyId = req.body.companyId
        ++changed
      }
      if ((req.body.reportingProtocolId) &&
                 (req.body.reportingProtocolId !== app.reportingProtocolId)) {
        data.reportingProtocolId = req.body.reportingProtocolId
        ++changed
      }
      if ((req.body.baseUrl) &&
                 (req.body.baseUrl !== app.baseUrl)) {
        data.baseUrl = req.body.baseUrl
        ++changed
      }
      if (changed === 0) {
        // No changes.  But returning 304 apparently causes Apache to strip
        // CORS info, causing the browser to throw a fit.  So just say,
        // "Yeah, we did that.  Really.  Trust us."
        restServer.respond(res, 204)
      }
      else {
        // Do the update.
        modelAPI.applications.updateApplication(data).then(function (rec) {
          restServer.respond(res, 204)
        })
          .catch(function (err) {
            restServer.respond(res, err)
          })
      }
    })
      .catch(function (err) {
        appLogger.log('Error getting application ' + req.body.name + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Deletes the application record with the specified id.
     *
     * @api {delete} /api/applications/:id Delete Application
     * @apiGroup Applications
     * @apiPermission System Admin, or Company Admin for this company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Application's id
     * @apiVersion 0.1.0
     */
  app.delete('/api/applications/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var id = parseInt(req.params.id)
    // If the caller is a global admin, we can just delete.
    if (req.company.type === modelAPI.companies.COMPANY_ADMIN) {
      modelAPI.applications.deleteApplication(id).then(function () {
        restServer.respond(res, 204)
      })
        .catch(function (err) {
          appLogger.log('Error deleting application ' + id + ': ' + err)
          restServer.respond(res, err)
        })
    }
    // Company admin
    else {
      modelAPI.applications.retrieveApplication(req.params.id).then(function (app) {
        // Verify that the user can delete.
        if (req.user.companyId !== app.companyId) {
          restServer.respond(res, 403)
          return
        }
        modelAPI.applications.deleteApplication(id).then(function () {
          restServer.respond(res, 204)
        })
          .catch(function (err) {
            appLogger.log('Error deleting application ' + id + ': ' + err)
            restServer.respond(res, err)
          })
      })
        .catch(function (err) {
          appLogger.log('Error finding application ' + id + ' to delete: ' + err)
          restServer.respond(res, err)
        })
    }
  })

  /**
     * @apiDescription Starts serving the data from the Networks to the
     *      Application server (baseUrl) using the Reporting Protocol for
     *      the Application.
     * @api {post} /api/applications/:id/start Start Application
     * @apiGroup Applications
     * @apiPermission System Admin, or Company Admin for this company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Application's id
     * @apiVersion 0.1.0
     */
  // Yeah, yeah, this isn't a pure REST call.  So sue me.  Gets the job done.
  app.post('/api/applications/:id/start', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var id = parseInt(req.params.id)
    // If the caller is a global admin, we can just start.
    if (req.company.type === modelAPI.companies.COMPANY_ADMIN) {
      modelAPI.applications.startApplication(id).then(function (logs) {
        restServer.respond(res, 200, logs.remoteAccessLogs)
      })
        .catch(function (err) {
          appLogger.log('Error starting application ' + id + ': ' + err)
          restServer.respond(res, err)
        })
    }
    // Company admin
    else {
      modelAPI.applications.retrieveApplication(req.params.id).then(function (app) {
        // Verify that the user can start.
        if (req.user.companyId !== app.companyId) {
          restServer.respond(res, 403)
          return
        }
        modelAPI.applications.startApplication(id).then(function (logs) {
          restServer.respond(res, 200, logs.remoteAccessLogs)
        })
          .catch(function (err) {
            appLogger.log('Error starting application ' + id + ': ' + err)
            restServer.respond(res, err)
          })
      })
        .catch(function (err) {
          appLogger.log('Error finding application ' + id + ' to start: ' + err)
          restServer.respond(res, err)
        })
    }
  })

  /**
     * @apiDescription Stops serving the data from the Networks to the
     *      Application server (baseUrl).
     * @api {post} /api/applications/:id/stop Stop Application
     * @apiGroup Applications
     * @apiPermission System Admin, or Company Admin for this company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Application's id
     * @apiVersion 0.1.0
     */
  // Yeah, yeah, this isn't a pure REST call.  So sue me.  Gets the job done.
  app.post('/api/applications/:id/stop', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var id = parseInt(req.params.id)
    // If the caller is a global admin, we can just stop.
    if (req.company.type === modelAPI.companies.COMPANY_ADMIN) {
      modelAPI.applications.stopApplication(id).then(function (logs) {
        restServer.respond(res, 200, logs.remoteAccessLogs)
      })
        .catch(function (err) {
          appLogger.log('Error stopping application ' + id + ': ' + err)
          restServer.respond(res, err)
        })
    }
    // Company admin
    else {
      modelAPI.applications.retrieveApplication(req.params.id).then(function (app) {
        // Verify that the user can stop this app.
        if (req.user.companyId !== app.companyId) {
          restServer.respond(res, 403)
          return
        }

        modelAPI.applications.stopApplication(id).then(function (logs) {
          restServer.respond(res, 200, logs.remoteAccessLogs)
        })
          .catch(function (err) {
            appLogger.log('Error stopping application ' + id + ': ' + err)
            restServer.respond(res, err)
          })
      })
        .catch(function (err) {
          appLogger.log('Error finding application ' + id + ' to start: ' + err)
          restServer.respond(res, err)
        })
    }
  })

  /**
     * Tests serving the data as if it came from a network.
     * Yeah, yeah, this isn't a pure REST call.  So sue me.  Gets the job done.
     */
  app.post('/api/applications/:id/test', function (req, res, next) {
    var id = parseInt(req.params.id)
    modelAPI.applications.testApplication(id, req.body).then(function (logs) {
      restServer.respond(res, 200)
    })
      .catch(function (err) {
        appLogger.log('Error testing application ' + id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * Accepts the data from the remote networks to pass to the reporting
     * protocol on behalf of the application.
     * - Any caller can pass data to this method.  We don't require them to be
     *   logged in.  We will reject messages for unknown applicationIds and/or
     *   networkIds with a generic 404.
     */
  app.post('/api/ingest/:applicationId/:networkId', function (req, res, next) {
    var applicationId = parseInt(req.params.applicationId)
    var networkId = parseInt(req.params.networkId)
    var data = req.body

    // make sure the network is enabled
    modelAPI.networks.retrieveNetwork(networkId)
      .then(network => {
        if (network.securityData.enabled) {
          appLogger.log('Received data from network ' + networkId +
            ' for application ' + applicationId +
            ': ' + JSON.stringify(data))

          modelAPI.applications.passDataToApplication(applicationId, networkId,
            data).then(function () {
            restServer.respond(res, 200)
          })
            .catch(function (err) {
              appLogger.log('Error passing data from network ' + networkId +
                ' to application ' + applicationId + ': ' + err)
              restServer.respond(res, err)
            })
        }
        else {
          restServer.respond(res, 200)
        }
      })
  })

  // Now that the API is initialized, start the known apps.
  modelAPI.applications.startApplications()
    .then(() => appLogger.log('Applications Started.'))
    .catch((err) => appLogger.log('Applications Startup Failed: ' + err))
}
