// Logging
const appLogger = require('./lib/appLogger.js')

var restServer
var modelAPI

exports.initialize = function (app, server) {
  restServer = server
  modelAPI = server.modelAPI

  /*********************************************************************
    * Companies API
    ********************************************************************/
  /**
     * Gets the companies available for access by the calling admin account.
     *
     * @api {get} /api/companies Get Companies
     * @apiGroup Companies
     * @apiDescription Returns an array of the Companies that match the options.
     *      Note that Company Admin users can only access their own Company.
     * @apiPermission System Admin, or Company Admin (limits returned data to
     *       user's own company)
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Query Parameters) {Number} [limit] The maximum number of
     *      records to return.  Use with offset to manage paging.  0 is the
     *      same as unspecified, returning all users that match other query
     *      parameters.
     * @apiParam (Query Parameters) {Number} [offset] The offset into the
     *      returned database query set.  Use with limit to manage paging.  0 is
     *      the same as unspecified, returning the list from the beginning.
     * @apiParam (Query Parameters) {String} [search] Search the Companies based
     *      on name matches to the passed string.  In the string, use "%" to
     *      match 0 or more characters and "_" to match exactly one.  For
     *      example, to match names starting with "D", use the string "D%".
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.totalCount The total number of records that
     *      would have been returned if offset and limit were not specified.
     *      This allows for calculation of number of "pages" of data.
     * @apiSuccess {Object[]} object.records An array of Company records.
     * @apiSuccess {Number} object.records.id The Company's Id
     * @apiSuccess {String} object.records.name The Company's name
     * @apiSuccess {String} object.records.type "admin" or "vendor"
     * @apiVersion 0.1.0
     */
  app.get('/api/companies', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var options = {}

    if (req.company.type.id !== modelAPI.companies.COMPANY_ADMIN) {
      // Must be company admin.  Can only get their own company, so just
      // give that.
      modelAPI.companies.retrieveCompany(req.company.id).then(function (co) {
        if (co) {
          co['type'] = modelAPI.companies.reverseTypes[co['type']]
          // Return the company as a single element array to keep in line
          // with the multiple company return from this method.
          restServer.respond(res, 200, { totalCount: 1, records: [ co ] })
        }
        else {
          restServer.respond(res, httpError.NotFound)
        }
      })
        .catch(function (err) {
          restServer.respond(res, err)
        })
      return
    }

    if (req.query.limit) {
      var limitInt = parseInt(req.query.limit, 10)
      if (!isNaN(limitInt)) {
        options.limit = limitInt
      }
    }
    if (req.query.offset) {
      var offsetInt = parseInt(req.query.offset, 10)
      if (!isNaN(offsetInt)) {
        options.offset = offsetInt
      }
    }
    if (req.query.search) {
      options.search = req.query.search
    }
    modelAPI.companies.retrieveCompanies(options).then(function (cos) {
      for (var i = 0; i < cos.records.length; i++) {
        cos.records[i].type = modelAPI.companies.reverseTypes[cos.records[i].type]
      }
      appLogger.log(cos)
      restServer.respond(res, 200, cos, true)
    })
      .catch(function (err) {
        appLogger.log('Error getting companies: ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Gets the company record with the specified id.
     *
     * @api {get} /api/companies/:id Get Company
     * @apiGroup Companies
     * @apiPermission Any, but only System Admin can retrieve a Company other
     *      than their own.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Company's id
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.id The Company's Id
     * @apiSuccess {String} object.name The Company's name
     * @apiSuccess {String} object.type "admin" or "vendor"
     * @apiVersion 0.1.0
     */
  app.get('/api/companies/:id', [restServer.isLoggedIn,
    restServer.fetchCompany],
  function (req, res, next) {
    var id = req.params.id
    if ((req.company.type.id !== modelAPI.companies.COMPANY_ADMIN) &&
             (req.company.id !== id)) {
      restServer.respond(res, 403)
      return
    }
    modelAPI.companies.retrieveCompany(parseInt(req.params.id, 10)).then(function (co) {
      co.type = modelAPI.companies.reverseTypes[co.type.id]
      restServer.respondJson(res, null, co)
    })
      .catch(function (err) {
        appLogger.log('Error getting company ' + req.params.id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Creates a new company record.
     *
     * @api {post} /api/companies Create Company
     * @apiGroup Companies
     * @apiPermission System Admin
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Request Body) {String} name The Company's name
     * @apiParam (Request Body) {String="Admin","Vendor"} type The Company's type
     * @apiExample {json} Example body:
     *      {
     *          "name": "IoT Stuff, Inc.",
     *          "type": "vendor"
     *      }
     * @apiSuccess {Number} id The new Company's id.
     * @apiVersion 0.1.0
     */
  app.post('/api/companies', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdminCompany],
  function (req, res, next) {
    var rec = req.body
    // You can't specify an id.
    if (rec.id) {
      restServer.respond(res, 400, "Cannot specify the company's id in create")
      return
    }

    // Verify that required fields exist.
    if (!rec.name || !rec.type) {
      restServer.respond(res, 400, 'Missing required data')
    }

    // Convert the type from string to number.
    var newtype = modelAPI.companies.types[ req.body.type ]
    if (newtype) {
      rec.type = newtype
    }
    else {
      // Bad type, bad request.
      restServer.respond(res, 400, 'Invalid type: ' + req.body.type)
      return
    }

    // Do the add.
    modelAPI.companies.createCompany(rec.name,
      rec.type).then(function (rec) {
      var send = {}
      send.id = rec.id
      restServer.respondJson(res, 200, send)
    })
      .catch(function (err) {
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Updates the company record with the specified id.
     *
     * @api {put} /api/companies/:id Update Company
     * @apiGroup Companies
     * @apiPermission System Admin, or Company Admin for this company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Company's id
     * @apiParam (Request Body) {String} [name] The Company's name
     * @apiParam (Request Body) {String="Admin","Vendor"} [type] The Company's type
     * @apiExample {json} Example body:
     *      {
     *          "name": "IoT Stuff, Inc.",
     *          "type": "vendor"
     *      }
     * @apiVersion 0.1.0
     */
  app.put('/api/companies/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var data = {}
    data.id = parseInt(req.params.id, 10)
    // We'll start by getting the company, as a read is much less expensive
    // than a write, and then we'll be able to tell if anything really
    // changed before we even try to write.
    modelAPI.companies.retrieveCompany(req.params.id).then(function (company) {
      // Fields that may exist in the request body that anyone (with permissions)
      // can change.  Make sure they actually differ, though.
      var changed = 0
      if ((req.body.name) &&
                 (req.body.name !== company.name)) {
        data.name = req.body.name
        ++changed
      }

      if (req.body.type) {
        var type = modelAPI.companies.types[ req.body.type ]
        if (type !== company.type.id) {
          data.type = type
          ++changed
        }
      }

      // In order to update a company record, the logged in user must
      // either be part of the admin company, or a company admin for the
      // company.
      if ((req.company.type.id !== modelAPI.companies.COMPANY_ADMIN) &&
                 (req.user.company.id !== data.id)) {
        // Nope.  Not allowed.
        restServer.respond(res, 403)
        return
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
        modelAPI.companies.updateCompany(data).then(function (rec) {
          restServer.respond(res, 204)
        })
          .catch(function (err) {
            restServer.respond(res, err)
          })
      }
    })
      .catch(function (err) {
        appLogger.log('Error getting company ' + req.body.name + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Deletes the company record with the specified id.
     *
     * @api {delete} /api/companies/:id Delete Company
     * @apiGroup Companies
     * @apiPermission System Admin
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Company's id
     * @apiVersion 0.1.0
     */
  app.delete('/api/companies/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdminCompany],
  function (req, res, next) {
    let id = parseInt(req.params.id, 10)
    modelAPI.companies.deleteCompany(id).then(function () {
      restServer.respond(res, 204)
    })
      .catch(function (err) {
        appLogger.log('Error deleting company ' + id + ': ' + err)
        restServer.respond(res, err)
      })
  })
}
