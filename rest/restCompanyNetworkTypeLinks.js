var appLogger = require('./lib/appLogger.js')

var restServer
var modelAPI
const { formatRelationshipsOut } = require('./lib/prisma')

exports.initialize = function (app, server) {
  restServer = server
  modelAPI = server.modelAPI

  /*********************************************************************
     * CompanyNetworkTypeLinks API.
     ********************************************************************
    /**
     * Gets the companyNetworkTypeLinks that are defined
     *
     * @api {get} /api/companyNetworkTypeLinks Get Company Network Type Links
     * @apiGroup Company Network Type Links
     * @apiDescription Returns an array of the Company Network Type Links that
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
     * @apiParam (Query Parameters) {Number} [companyId] Limit the records
     *      to those that have the companyId specified.
     * @apiParam (Query Parameters) {Number} [networkTypeId] Limit the records
     *      to those that have the networkTypeId specified.
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.totalCount The total number of records that
     *      would have been returned if offset and limit were not specified.
     *      This allows for calculation of number of "pages" of data.
     * @apiSuccess {Object[]} object.records An array of Company Network Type
     *      Links records.
     * @apiSuccess {Number} object.records.id The Company Network Type Link's Id
     * @apiSuccess {Number} object.records.companyId The Company the record is
     *      linking to the Network Type.
     * @apiSuccess {Number} object.records.networkTypeId The Network Type
     *      that the Company is being linked to.
     * @apiSuccess {String} object.records.networkSettings The settings in a
     *      JSON string that correspond to the Network Type.
     * @apiVersion 0.1.0
     */
  app.get('/api/companyNetworkTypeLinks', [ restServer.isLoggedIn,
    restServer.fetchCompany ],
  function (req, res) {
    var options = { ...req.query }
    // Limit by company, too, if not a system admin.
    if (req.company.type !== 'ADMIN') {
      options.companyId = req.company.id
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
    modelAPI.companyNetworkTypeLinks.list(options).then(function ([ records, totalCount ]) {
      const responseBody = { totalCount, records: records.map(formatRelationshipsOut) }
      restServer.respondJson(res, null, responseBody)
    })
      .catch(function (err) {
        appLogger.log('Error getting networkTypes: ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Gets the companyNetworkTypeLink record with the
     *      specified id.
     *
     * @api {get} /api/companyNetworkTypeLinks/:id Get Company Network Type Link
     * @apiGroup Company Network Type Links
     * @apiPermission Any, but only System Admin can retrieve a Company Network
     *      Type Link other than one belonging to their own company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Company Network Type Link's id
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.id The Company Network Type Link's Id
     * @apiSuccess {Number} object.companyId The Company the record is
     *      linking to the Network Type.
     * @apiSuccess {Number} object.networkTypeId The Network Type
     *      that the Company is being linked to.
     * @apiSuccess {String} object.networkSettings The settings in a
     *      JSON string that correspond to the Network Type.
     * @apiVersion 0.1.0
     */
  app.get('/api/companyNetworkTypeLinks/:id', [restServer.isLoggedIn],
    function (req, res) {
      var id = req.params.id
      modelAPI.companyNetworkTypeLinks.load(id).then(function (np) {
        restServer.respondJson(res, null, formatRelationshipsOut(np))
      })
        .catch(function (err) {
          appLogger.log('Error getting companyNetworkTypeLink ' + id + ': ' + err)
          restServer.respond(res, err)
        })
    })

  /**
     * @apiDescription Creates a new companyNetworkTypeLink record.  Also
     *      creates the Company on the remote Networks of the Network Type.
     *
     * @api {post} /api/companyNetworkTypeLinks Create Company Network Type Link
     * @apiGroup Company Network Type Links
     * @apiPermission System Admin
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Request Body) {Number} companyId The Company the record is
     *      linking to the Network Type.
     * @apiParam (Request Body) {Number} networkTypeId The Network Type
     *      that the Company is being linked to.
     * @apiParam (Request Body) {String} networkSettings The settings in a
     *      JSON string that correspond to the Network Type.
     * @apiExample {json} Example body:
     *      {
     *          "companyId": 2,
     *          "networkTypeId": 4,
     *          "networkSettings": "{ ... }",
     *      }
     * @apiSuccess {Number} id The new Company Network Type Link's id.
     * @apiVersion 0.1.0
     */
  app.post('/api/companyNetworkTypeLinks', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res) {
    var rec = req.body

    // If the user is part of the admin group and does not have a companyId
    // specified.
    if ((modelAPI.companies.COMPANY_ADMIN === req.company.type.id) &&
             (!rec.companyId)) {
      restServer.respond(res, 400, 'Must have companyId when part of admin company')
      return
    }

    // If the user is a not company admin, and is specifying another
    // company.
    if ((modelAPI.companies.COMPANY_ADMIN !== req.company.type.id) &&
             rec.companyId &&
             (rec.companyId !== req.user.company.id)) {
      restServer.respond(res, 403, "Cannot specify another company's networks")
      return
    }

    if (!rec.companyId) {
      rec.companyId = req.user.company.id
    }

    // You can't specify an id.
    if (rec.id) {
      restServer.respond(res, 400, "Cannot specify the companyNetworkTypeLink's id in create")
      return
    }

    // Verify that required fields exist.
    if (!rec.companyId || !rec.networkTypeId) {
      restServer.respond(res, 400, 'Missing required data')
      return
    }

    // Do the add.
    modelAPI.companyNetworkTypeLinks.create(
      rec.companyId,
      rec.networkTypeId,
      rec.networkSettings).then(function (rec) {
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
     * @apiDescription Updates the companyNetworkTypeLink record with the
     *      specified id.  Also pushes the updates to the remote Networks of
     *      the Network Type.
     *
     * @api {put} /api/companyNetworkTypeLinks/:id
     *      Update Company Network Type Link
     * @apiGroup Company Network Type Links
     * @apiPermission System Admin
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Company Network Type Link's id
     * @apiParam (Request Body) {String} [networkSettings] The settings in a
     *      JSON string that correspond to the Network Type.
     * @apiExample {json} Example body:
     *      {
     *          "networkSettings": "{ ... }",
     *      }
     * @apiVersion 0.1.0
     */
  app.put('/api/companyNetworkTypeLinks/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res) {
    // We're not going to allow changing the company or the network.
    // Neither operation makes much sense.
    if (req.body.companyId || req.body.networkTypeId) {
      restServer.respond(res, 400, 'Cannot change link targets')
      return
    }

    var data = { id: req.params.id }
    // We'll start by getting the network, as a read is much less expensive
    // than a write, and then we'll be able to tell if anything really
    // changed before we even try to write.
    modelAPI.companyNetworkTypeLinks.load(data.id).then(function (cnl) {
      // If not an admin company, the companyId better match the user's
      // companyId.
      if ((req.company.type !== 'ADMIN') &&
                 (cnl.company.id !== req.user.company.id)) {
        restServer.respond(res, 403, "Cannot change another company's record.")
        return
      }

      // Fields that may exist in the request body that can change.  Make
      // sure they actually differ, though.
      var changed = 0
      if (req.body.networkSettings) {
        if (req.body.networkSettings !== cnl.networkSettings) {
          data.networkSettings = req.body.networkSettings
          ++changed
        }
      }

      // Ready.  Do we have anything to actually change?
      if (changed === 0) {
        // No changes.  But returning 304 apparently causes Apache to strip
        // CORS info, causing the browser to throw a fit.  So just say,
        // "Yeah, we did that.  Really.  Trust us."
        restServer.respond(res, 204)
      }
      else {
        // Do the update.
        modelAPI.companyNetworkTypeLinks.update(data).then(function (rec) {
          restServer.respondJson(res, 200, { remoteAccessLogs: rec.remoteAccessLogs })
        })
          .catch(function (err) {
            restServer.respond(res, err)
          })
      }
    })
      .catch(function (err) {
        appLogger.log('Error getting companyNetworkTypeLink ' + data.id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Deletes the companyNetworkTypeLinks record with the
     *      specified id.  Also deletes the Company on the remote Networks of
     *      the Network Type.
     *
     * @api {delete} /api/companyNetworkTypeLinks/:id
     *      Delete Company Network Type Link
     * @apiGroup Company Network Type Links
     * @apiPermission System Admin
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Company Network Type Link's id
     * @apiVersion 0.1.0
     */
  app.delete('/api/companyNetworkTypeLinks/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res) {
    var id = req.params.id
    // If the caller is a global admin, we can just delete.
    if (req.company.type === 'ADMIN') {
      modelAPI.companyNetworkTypeLinks.remove(id).then(function (ret) {
        restServer.respondJson(res, 200, { remoteAccessLogs: ret })
      })
        .catch(function (err) {
          appLogger.log('Error deleting companyNetworkTypeLink ' + id + ': ' + err)
          restServer.respond(res, err)
        })
    }
    else {
      // We'll need to read first to make sure the record is for the
      // company the company admin is part of.
      modelAPI.companyNetworkTypeLinks.load(id).then(function (cnl) {
        if (req.company.id !== cnl.company.id) {
          restServer.respond(res, 400, 'Unauthorized to delete record')
        }
        else {
          // OK to do the  delete.
          modelAPI.companyNetworkTypeLinks.remove(id).then(function (ret) {
            restServer.respondJson(res, 200, { remoteAccessLogs: ret })
          })
            .catch(function (err) {
              appLogger.log('Error deleting companyNetworkTypeLink ' + id + ': ' + err)
              restServer.respond(res, err)
            })
        }
      })
        .catch(function (err) {
          restServer.respond(res, err)
        })
    }
  })

  /**
     * Pushes the companyNetworkTypeLinks record with the specified id.
     * - Only a user with the admin company or the admin of the device's
     *   company can delete an device. TODO: Is this true?
     */
  app.post('/api/companyNetworkTypeLinks/:id/push', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res) {
    var id = req.params.id
    // If the caller is a global admin, or the device is part of the company
    // admin's company, we can push.
    modelAPI.companyNetworkTypeLinks.pushCompanyNetworkTypeLink(id, req.company.id).then(function (ret) {
      restServer.respond(res, 200, ret)
    }).catch(function (err) {
      appLogger.log('Error pushing companyNetworkTypeLinks ' + id + ': ' + err)
      restServer.respond(res, err)
    })
  })

  /**
     * Pushes the companyNetworkTypeLinks record with the specified id.
     * - Only a user with the admin company or the admin of the device's
     *   company can delete an device. TODO: Is this true?
     */
  app.post('/api/companyNetworkTypeLinks/:networkId/pull', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var networkId = req.params.networkId
    // If the caller is a global admin, or the device is part of the company
    // admin's company, we can push.
    modelAPI.companyNetworkTypeLinks.pullCompanyNetworkTypeLink(networkId).then(function (ret) {
      restServer.respondJson(res, 200, ret)
    }).catch(function (err) {
      appLogger.log('Error pulling from network ' + networkId + ': ' + err)
      restServer.respond(res, err)
    })
  })
}
