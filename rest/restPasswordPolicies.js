var appLogger = require('./lib/appLogger.js')
var restServer
var modelAPI
const { formatRelationshipsOut } = require('./lib/prisma')

exports.initialize = function (app, server) {
  restServer = server
  modelAPI = server.modelAPI

  /*********************************************************************
     * Password Policy
     ********************************************************************/
  /**
      * @apiDescription Gets the password policy records for the company.  All
      *         returned records' ruleRegExp fields must "match" an entered
      *         password for it to be considered valid for the company.
      *
      * @api {get} /api/passwordPolicies/company/:companyId
      *     Get Company Password Policies
      * @apiGroup Password Policies
      * @apiPermission Any logged-in user.
      * @apiHeader {String} Authorization The Create Session's returned token
      *      prepended with "Bearer "
      * @apiParam (URL Parameters) {Number} companyId The Company's id for
      *     which to retrieve the Password Policies.
      * @apiSuccess {Object[]} object An array of Password Policy records.
      * @apiSuccess {Number} object.id The Password Policy's Id
      * @apiSuccess {String} object.ruleText The Password Policy's description,
      *     intended for display to the end user.
      * @apiSuccess {String} object.ruleRegExp The Password Policy's
      *     Javascript regular expression, which must "match" the entered
      *     password for it to be considered valid.
      * @apiSuccess {Boolean} [object.global] True indicates a system-wide rule,
      *     which can only be changed by a System Admin.
      * @apiVersion 0.1.0
      */
  app.get('/api/passwordPolicies/company/:companyId',
    [restServer.isLoggedIn,
      restServer.fetchCompany],
    function (req, res) {
      var companyId = req.params.companyId

      // Must be admin user or part of the company.
      if ((req.company.type !== 'ADMIN') &&
              (req.company.id !== companyId)) {
        restServer.respond(res, 403)
        return
      }

      modelAPI.passwordPolicies.list(companyId).then(function (rules) {
        for (var i = 0; i < rules.length; ++i) {
          if (rules[ i ].company) {
            delete rules[ i ].company
          }
          else {
            // Usually is in the record as "null".
            delete rules[ i ].company
            rules[ i ].global = true
          }
        }
        restServer.respondJson(res, null, rules)
      })
        .catch(function (err) {
          appLogger.log('Error getting passwordPolicies: ' + err)
          restServer.respond(res, err)
        })
    })

  /**
      * @apiDescription Gets the Password Policy record with the specified id.
      *
      * @api {get} /api/passwordPolicies/:id Get Password Policy
      * @apiGroup Password Policies
      * @apiPermission Any logged-in user can get their own company's Password
      *     Policies or global Password Policies.  System Admin can get any
      *     Password Policy.
      * @apiHeader {String} Authorization The Create Session's returned token
      *      prepended with "Bearer "
      * @apiParam (URL Parameters) {Number} id The Password Policy's id.
      * @apiSuccess {Number} id The Password Policy's Id
      * @apiSuccess {String} ruleText The Password Policy's description,
      *     intended for display to the end user.
      * @apiSuccess {String} ruleRegExp The Password Policy's
      *     Javascript regular expression, which must "match" the entered
      *     password for it to be considered valid.
      * @apiSuccess {Number} companyId The company who owns this Password Policy
      *     or null if a global policy.
      * @apiVersion 0.1.0
      */
  app.get('/api/passwordPolicies/:id', [restServer.isLoggedIn,
    restServer.fetchCompany],
  function (req, res) {
    let { id } = req.params

    modelAPI.passwordPolicies.load(id).then(function (pp) {
      // Must be an admin user or
      // it's global passwordPolicy rule or
      // the caller is part of the company that the passwordPolicy rule is
      // assigned to
      if ((req.company.type === 'ADMIN') ||
                  (!pp.company.id) ||
                  (pp.company.id === req.company.id)) {
        restServer.respondJson(res, null, formatRelationshipsOut(pp))
      }
      else {
        // Not a passwordPolicy this user should see.
        restServer.respond(res, 403)
      }
    })
      .catch(function (err) {
        appLogger.log('Error getting passwordPolicy ' + id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Creates a new Password Policy record.
     *
     * @api {post} /api/passwordPolicies Create Password Policy
     * @apiGroup Password Policies
     * @apiPermission System Admin can create a Password Policy for any Company
     *      or a global Password Policy (no companyId).  A Company Admin can
     *      create Password Policies for their own company only.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Request Body) {String} ruleText The Password Policy's
     *     description, intended for display to the end user.
     * @apiParam (Request Body) {String} ruleRegExp The Password Policy's
     *     Javascript regular expression, which must "match" the entered
     *     password for it to be considered valid.
     * @apiParam (Request Body) {Number} [companyId] The id of the company that
     *      this Password Policy belongs to.  If not supplied, for
     *      a System Admin, defaults to null (global rule for all
     *      users/companies).  For Company Admin, defaults to the user's
     *      companyId.  If specified by a Company Admin, it MUST match their
     *      own company.
     * @apiExample {json} Example body:
     *      {
     *          "ruleText": "Must contain a digit",
     *          "ruleRegexp": "[0-9]",
     *          "companyId": 3
     *      }
     * @apiSuccess {Number} id The new Password Policy's id.
     * @apiVersion 0.1.0
     */
  app.post('/api/passwordPolicies', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res) {
    var rec = req.body
    // You can't specify an id.
    if (rec.id) {
      restServer.respond(res, 400, "Cannot specify the passwordPolicy's id in create")
      return
    }

    // Verify that required fields exist.
    if (!rec.ruleText || !rec.ruleRegExp) {
      restServer.respond(res, 400, 'Missing required data')
      return
    }

    // If the user is not part of the admin group...
    if (modelAPI.companies.COMPANY_ADMIN !== req.company.type.id) {
      // Did they specify the companyId?
      if (rec.companyId) {
        // It better match the company they are part of.
        if (rec.companyId !== req.company.id) {
          restServer.respond(res, 400, 'Cannot specify a passordPolicy for a different company')
          return
        }
      }
      else {
        // No company specified implies "my company".
        rec.companyId = req.company.id
      }
    }

    // Do the add.
    modelAPI.passwordPolicies.create(rec.ruleText, rec.ruleRegExp, rec.companyId).then(function (rec) {
      var send = {}
      send.id = rec.id
      restServer.respondJson(res, 200, send)
    })
      .catch(function (err) {
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Updates the Password Policy record with the specified id.
     *
     * @api {put} /api/passwordPolicies/:id Update Password Policy
     * @apiGroup Password Policies
     * @apiPermission System Admin, or Company Admin for the Password Policy's *       Company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Password Policy's id
     * @apiParam (Request Body) {String} [ruleText] The Password Policy's
     *     description, intended for display to the end user.
     * @apiParam (Request Body) {String} [ruleRegExp] The Password Policy's
     *     Javascript regular expression, which must "match" the entered
     *     password for it to be considered valid.
     * @apiParam (Request Body) {Number} [companyId] The id of the company that
     *      this Password Policy belongs to.  Can only be specified by a
     *      System Admin.
     * @apiExample {json} Example body:
     *      {
     *          "ruleText": "Must contain a digit",
     *          "ruleRegexp": "[0-9]"
     *      }
     * @apiVersion 0.1.0
     */
  app.put('/api/passwordPolicies/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res) {
    var data = { id: req.params.id }

    // We'll start by getting the passwordPolicy, as a read is much less
    // expensive than a write, and then we'll be able to tell if anything
    // really changed before we even try to write.
    modelAPI.passwordPolicies.load(data.id).then(function (pp) {
      let changed = 0
      // If a company admin, cannot change companyId.
      if ((req.company.type !== 'ADMIN') &&
                 (req.body.companyId) &&
                 ((pp.company.id !== req.companyId) ||
                   (req.body.companyId !== pp.company.id))) {
        restServer.respond(res, 403, 'Company cannot be changed by non-system admin account')
        return
      }
      else if (req.body.companyId) {
        if (req.body.companyId !== pp.company.id) {
          data.companyId = req.body.companyId
          ++changed
        }
      }

      // If a company admin, must be a passwordPolicy for that company.
      if ((req.company.type !== 'ADMIN') &&
                 (!pp.company.id || pp.company.id !== req.company.id)) {
        restServer.respond(res, 403, 'Cannot change the passwordPolicy of another company or global passwordPolicies')
        return
      }

      // Fields that may exist in the request body that anyone (with
      // permissions) can change.  Make sure they actually differ, though.
      if ((req.body.ruleText) &&
                 (req.body.ruleText !== pp.ruleText)) {
        data.ruleText = req.body.ruleText
        ++changed
      }

      if (req.body.ruleRegExp) {
        if (req.body.ruleRegExp !== pp.ruleRegExp) {
          data.ruleRegExp = req.body.ruleRegExp
          ++changed
        }
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
        modelAPI.passwordPolicies.update(data).then(function () {
          restServer.respond(res, 204)
        })
          .catch(function (err) {
            restServer.respond(res, err)
          })
      }
    })
      .catch(function (err) {
        appLogger.log('Error getting PasswordPolicy ' + req.params.id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
      * @apiDescription Deletes the Password Policy record with the specified
      *     id.
      *
      * @api {delete} /api/passwordPolicies/:id Delete Password Policy
      * @apiGroup Password Policies
      * @apiPermission System Admin, or Company Admin for the Password Policy's
      *     company.
      * @apiHeader {String} Authorization The Create Session's returned token
      *      prepended with "Bearer "
      * @apiParam (URL Parameters) {Number} id The Password Policy's id
      * @apiVersion 0.1.0
      */
  app.delete('/api/passwordPolicies/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res) {
    let { id } = req.params
    // If the caller is a global admin, we can just delete.
    if (req.company.type === 'ADMIN') {
      modelAPI.passwordPolicies.remove(id).then(function () {
        restServer.respond(res, 204)
      })
        .catch(function (err) {
          appLogger.log('Error deleting passwordPolicy ' + id + ': ' + err)
          restServer.respond(res, err)
        })
    }
    else {
      // We'll need to read first to make sure the record is for the
      // company the company admin is part of.
      modelAPI.passwordPolicies.load(id).then(function (pp) {
        if (req.company.id !== pp.company.id) {
          restServer.respond(res, 400, 'Unauthorized to delete record')
        }
        else {
          // OK to do the  delete.
          modelAPI.passwordPolicies.remove(id).then(function () {
            restServer.respond(res, 204)
          })
            .catch(function (err) {
              appLogger.log('Error deleting passwordPolicy ' + id + ': ' + err)
              restServer.respond(res, err)
            })
        }
      })
        .catch(function (err) {
          restServer.respond(res, err)
        })
    }
  })
}
