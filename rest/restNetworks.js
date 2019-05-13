var appLogger = require('./lib/appLogger.js')
var restServer
var modelAPI
const { formatRelationshipsOut } = require('./lib/prisma')
const R = require('ramda')

exports.initialize = function (app, server) {
  restServer = server
  modelAPI = server.modelAPI

  /*********************************************************************
   * Networks API.
   ********************************************************************
   /**
   * Gets the networks available
   *
   * @api {get} /api/networks Get Networks
   * @apiGroup Networks
   * @apiDescription Returns an array of the Networks that match the
   *      options.
   * @apiPermission Any logged-in user, but only System Admins receive the
   *      networkSecurity field(s).
   * @apiHeader {String} Authorization The Create Session's returned token
   *      prepended with "Bearer "
   * @apiParam (Query Parameters) {Number} [limit] The maximum number of
   *      records to return.  Use with offset to manage paging.  0 is the
   *      same as unspecified, returning all users that match other query
   *      parameters.
   * @apiParam (Query Parameters) {Number} [offset] The offset into the
   *      returned database query set.  Use with limit to manage paging.  0 is
   *      the same as unspecified, returning the list from the beginning.
   * @apiParam (Query Parameters) {String} [search] Search the Networks
   *      based on name matches to the passed string.  In the string, use "%"
   *      to match 0 or more characters and "_" to match exactly one.  For
   *      example, to match names starting with "D", use the string "D%".
   * @apiParam (Query Parameters) {Number} [networkProviderId] Limit the
   *      Networks to those being provided by the Network Provider.
   * @apiParam (Query Parameters) {Number} [networkTypeId] Limit the
   *      Networks to those that support the Network Type.
   * @apiParam (Query Parameters) {Number} [networkProtocolId] Limit the
   *      Networks to those that use the Network Protocol.
   * @apiSuccess {Object} object
   * @apiSuccess {Number} object.totalCount The total number of records that
   *      would have been returned if offset and limit were not specified.
   *      This allows for calculation of number of "pages" of data.
   * @apiSuccess {Object[]} object.records An array of Network records.
   * @apiSuccess {Number} object.records.id The Network's Id
   * @apiSuccess {String} object.records.name The Network's name
   * @apiSuccess {Number} object.records.networkProviderId The Id of the
   *      Network Provider that provides the Network.
   * @apiSuccess {Number} object.records.networkTypeId The Id of the
   *      Network Type that the Network uses.
   * @apiSuccess {Number} object.records.networkProtocolId The Id of the
   *      Network Protocol that the Network uses.
   * @apiSuccess {String} object.records.baseUrl The base URL used by the
   *      Network Protocol to reach the Network's API server.
   * @apiSuccess {Number} object.records.securityData The data used to grant
   *      secure access to the Network's server API.  (Only returned to
   *      System Admins.)
   * @apiVersion 0.1.0
   */
  app.get('/api/networks', [restServer.isLoggedIn,
    restServer.fetchCompany],
  function (req, res, next) {
    var options = {}
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
    if (req.query.networkProviderId) {
      options.networkProviderId = req.query.networkProviderId
    }
    if (req.query.networkTypeId) {
      options.networkTypeId = req.query.networkTypeId
    }
    if (req.query.networkProtocolId) {
      options.networkProtocolId = req.query.networkProtocolId
    }
    const isAdmin = req.company.type.id !== modelAPI.companies.COMPANY_ADMIN
    const mapSecurityData = isAdmin ? R.identity : R.pick(['authorized', 'message', 'enabled'])
    modelAPI.networks.list(options).then(function (networks) {
      for (let i = 0; i < networks.records.length; ++i) {
        if (networks.records[i].securityData) {
          let temp = {
            authorized: networks.records[i].securityData.authorized,
            message: networks.records[i].securityData.message,
            enabled: networks.records[i].securityData.enabled
          }
          appLogger.log(networks.records[i])
          if (networks.records[i].securityData.clientId) {
            temp.clientId = networks.records[i].securityData.clientId
            temp.clientSecret = networks.records[i].securityData.clientSecret
          }
          else if (networks.records[i].securityData.apikey) {
            temp.apikey = networks.records[i].securityData.apikey
          }
          else if (networks.records[i].securityData.username) {
            temp.username = networks.records[i].securityData.username
            temp.password = networks.records[i].securityData.password
          }
          networks.records[i].securityData = mapSecurityData(temp)
        }
      }
      const responseBody = {
        ...networks,
        records: networks.records.map(formatRelationshipsOut)
      }
      restServer.respond(res, 200, responseBody)
    })
      .catch(function (err) {
        appLogger.log('Error getting networks: ' + err)
        restServer.respond(res, err)
      })
  })

  app.get('/api/networks/group', [restServer.isLoggedIn,
    restServer.fetchCompany],
  function (req, res, next) {
    var options = {}
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
    if (req.query.networkProviderId) {
      options.networkProviderId = req.query.networkProviderId
    }
    if (req.query.networkTypeId) {
      options.networkTypeId = req.query.networkTypeId
    }
    if (req.query.networkProtocolId) {
      options.networkProtocolId = req.query.networkProtocolId
    }
    const isAdmin = req.company.type.id !== modelAPI.companies.COMPANY_ADMIN
    const mapSecurityData = isAdmin ? R.identity : R.pick(['authorized', 'message', 'enabled'])
    modelAPI.networks.list(options).then(function (networks) {
      modelAPI.networkProtocols.list(options).then(function (recs) {
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
              nps.records[counter].versions.push(rec.id)
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
              networkTypeId: rec.networkType.id,
              versions: [rec.id],
              networks: []
            })
          }
        }

        for (let i = 0; i < networks.records.length; ++i) {
          if (networks.records[i].securityData) {
            let temp = {
              authorized: networks.records[i].securityData.authorized,
              message: networks.records[i].securityData.message,
              enabled: networks.records[i].securityData.enabled
            }
            appLogger.log(networks.records[i])
            if (networks.records[i].securityData.clientId) {
              temp.clientId = networks.records[i].securityData.clientId
              temp.clientSecret = networks.records[i].securityData.clientSecret
            }
            else if (networks.records[i].securityData.apikey) {
              temp.apikey = networks.records[i].securityData.apikey
            }
            else if (networks.records[i].securityData.username) {
              temp.username = networks.records[i].securityData.username
              temp.password = networks.records[i].securityData.password
            }
            networks.records[i].securityData = mapSecurityData(temp)
          }
          // Add network to correct protocol
          for (let npIndex = 0; npIndex < nps.records.length; npIndex++) {
            if (nps.records[npIndex].versions.includes(networks.records[i].networkProtocol.id)) {
              nps.records[npIndex].networks.push(formatRelationshipsOut(networks.records[i]))
            }
          }
        }
        restServer.respond(res, 200, nps)
      })
    })
      .catch(function (err) {
        appLogger.log('Error getting networks: ' + err)
        restServer.respond(res, err)
      })
  })

  /**
 * @apiDescription Gets the Network record with the specified id.
 *
 * @api {get} /api/networks/:id Get Network
 * @apiGroup Networks
 * @apiPermission Any logged-in user, but only System Admins receive the
 *      networkSecurity field.
 * @apiHeader {String} Authorization The Create Session's returned token
 *      prepended with "Bearer "
 * @apiParam (URL Parameters) {Number} id The Network's id
 * @apiSuccess {Object} object
 * @apiSuccess {Number} object.id The Network's Id
 * @apiSuccess {String} object.name The Network's name
 * @apiSuccess {Number} object.networkProviderId The Id of the
 *      Network Provider that provides the Network.
 * @apiSuccess {Number} object.networkTypeId The Id of the
 *      Network Type that the Network uses.
 * @apiSuccess {Number} object.networkProtocolId The Id of the
 *      Network Protocol that the Network uses.
 * @apiSuccess {String} object.baseUrl The base URL used by the
 *      Network Protocol to reach the Network's API server.
 * @apiSuccess {Number} object.securityData The data used to grant
 *      secure access to the Network's server API. (Only returned to System
 *      Admins.)
 * @apiVersion 0.1.0
 */
  app.get('/api/networks/:id', [restServer.isLoggedIn,
    restServer.fetchCompany],
  function (req, res, next) {
    var id = parseInt(req.params.id, 10)
    const isAdmin = req.company.type.id === modelAPI.companies.COMPANY_ADMIN
    const mapSecurityData = isAdmin ? R.identity : R.pick(['authorized', 'message', 'enabled'])
    modelAPI.networks.load(id).then(function (network) {
      if (network.securityData) {
        let temp = {
          authorized: network.securityData.authorized,
          message: network.securityData.message,
          enabled: network.securityData.enabled
        }
        if (network.securityData.clientId) {
          temp.clientId = network.securityData.clientId
          temp.clientSecret = network.securityData.clientSecret
        }
        else if (network.securityData.apikey) {
          temp.apikey = network.securityData.apikey
        }
        else if (network.securityData.username) {
          temp.username = network.securityData.username
          temp.password = network.securityData.password
        }
        network.securityData = mapSecurityData(temp)
      }
      restServer.respond(res, 200, formatRelationshipsOut(network))
    })
      .catch(function (err) {
        appLogger.log('Error getting network ' + id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
 * @apiDescription Creates a new Network record.
 *
 * @api {post} /api/networks Create Network
 * @apiGroup Networks
 * @apiPermission System Admin.
 * @apiHeader {String} Authorization The Create Session's returned token
 *      prepended with "Bearer "
 * @apiParam (Request Body)  {String} name The Network's name
 * @apiParam (Request Body)  {Number} networkProviderId The Id of the
 *      Network Provider that provides the Network.
 * @apiParam (Request Body)  {Number} networkTypeId The Id of the
 *      Network Type that the Network uses.
 * @apiParam (Request Body)  {Number} networkProtocolId The Id of the
 *      Network Protocol that the Network uses.
 * @apiParam (Request Body) {String} baseUrl The base URL used by the
 *      Network Protocol to reach the Network's API server.
 * @apiParam (Request Body)  {Number} securityData The data used to grant
 *      secure access to the Network's server API.  This data is defined by
 *      the Network Type.
 * @apiExample {json} Example body:
 *      {
 *          "name": "Kyrio LoRa Server",
 *          "networkProviderId": 1,
 *          "networkTypeId": 1,
 *          "networkProtocolId": 2,
 *          "baseUrl": "https://lora.kyrio.com/api"
 *          "securityData": {
 *                              "username": "admin",
 *                              "password": "somesecretpassword"
 *                          }
 *      }
 * @apiSuccess {Number} id The new Network's id.
 * @apiVersion 0.1.0
 */
  app.post('/api/networks',
    [restServer.isLoggedIn, restServer.fetchCompany, restServer.isAdminCompany],
    async function (req, res) {
      const { body } = req
      appLogger.log(`POST /networks: ${JSON.stringify(body)}`)

      if (body.id) {
        restServer.respond(res, 400, "Cannot specify the network's id in create")
        return
      }

      const required = ['name', 'networkTypeId', 'networkProtocolId', 'baseUrl']
      if (required.some(x => !body[x])) {
        restServer.respond(res, 400, 'Missing required data')
        return
      }

      // Issue 176, Remove trailing '/' in the url if there
      if (R.last(body.baseUrl) === '/') {
        body.baseUrl = body.baseUrl.slice(0, body.baseUrl.length - 1)
      }

      if (!body.securityData) {
        body.securityData = { enabled: false }
      }

      let network

      try {
        network = await modelAPI.networks.create(body)
        appLogger.log(network)
      }
      catch (err) {
        appLogger.log('Error creating network: ' + err)
        restServer.respond(res, err)
        return
      }

      let props = ['authorized', 'message', 'enabled']
      if (network.securityData.clientId) props.push('clientId', 'clientSecret')
      else if (network.securityData.apikey) props.push('apiKey')
      else if (network.securityData.username) props.push('username', 'password')
      network.securityData = R.pick(props, network.securityData)

      const pickSecDataProps = R.evolve({ securityData: R.pick(['authorized', 'message']) })

      if (!network.securityData.authorized) {
        restServer.respond(res, 201, formatRelationshipsOut(pickSecDataProps(network)))
        return
      }

      try {
        await modelAPI.networks.pullNetwork(network.id)
        appLogger.log('Success pulling from network ' + network.name)
      }
      catch (err) {
        appLogger.log('Error pulling from network ' + network.id + ': ' + err)
        appLogger.log(network.securityData)
        if (!network.securityData.authorized) {
          network.securityData.message = 'Pending Authorization'
          restServer.respond(res, 201, formatRelationshipsOut(pickSecDataProps(network)))
          return
        }
        restServer.respond(res, err)
        return
      }

      try {
        await modelAPI.networks.pushNetworks(network.networkType.id)
        appLogger.log('Success pushing to networks')
        restServer.respond(res, 201, formatRelationshipsOut(pickSecDataProps(network)))
      }
      catch (err) {
        appLogger.log('Error pushing to networks: ' + err)
        restServer.respond(res, err)
      }
    }
  )

  /**
 * @apiDescription Updates the Network record with the specified id.
 *
 * @api {put} /api/networks/:id Update Network
 * @apiGroup Networks
 * @apiPermission System Admin
 * @apiHeader {String} Authorization The Create Session's returned token
 *      prepended with "Bearer "
 * @apiParam (URL Parameters) {Number} id The Network's id
 * @apiParam (Request Body)  {String} [name] The Network's name
 * @apiParam (Request Body)  {Number} [networkProviderId] The Id of the
 *      Network Provider that provides the Network.
 * @apiParam (Request Body)  {Number} [networkTypeId] The Id of the
 *      Network Type that the Network uses.
 * @apiParam (Request Body)  {Number} [networkProtocolId] The Id of the
 *      Network Protocol that the Network uses.
 * @apiParam (Request Body) {String} [baseUrl] The base URL used by the
 *      Network Protocol to reach the Network's API server.
 * @apiParam (Request Body)  {Number} [securityData] The data used to grant
 *      secure access to the Network's server API.  This data is defined by
 *      the Network Type.
 * @apiExample {json} Example body:
 *      {
 *          "name": "Kyrio LoRa Server",
 *          "networkProviderId": 1,
 *          "networkTypeId": 1,
 *          "networkProtocolId": 2,
 *          "baseUrl": "https://lora.kyrio.com/api"
 *          "securityData": {
 *                              "username": "admin",
 *                              "password": "somesecretpassword"
 *                          }
 *      }
 */
  app.put('/api/networks/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdminCompany],
  function (req, res, next) {
    var data = req.body
    var pullFlag = (data.securityData && data.securityData.authorized === false)
    data.id = parseInt(req.params.id, 10)
    modelAPI.networks.update(data)
      .then(function (rec) {
        modelAPI.networks.load(rec.id)
          .then((network) => {
            if (!network.securityData) {
              network.securityData = {
                authorized: false,
                message: 'Pending Authorization',
                enabled: false
              }
            }

            let temp = {
              authorized: network.securityData.authorized,
              message: network.securityData.message,
              enabled: network.securityData.enabled
            }
            if (network.securityData.clientId) {
              temp.clientId = network.securityData.clientId
              temp.clientSecret = network.securityData.clientSecret
            }
            else if (network.securityData.apikey) {
              temp.apikey = network.securityData.apikey
            }
            else if (network.securityData.username) {
              temp.username = network.securityData.username
              temp.password = network.securityData.password
            }
            network.securityData = temp

            if (network.securityData.authorized === false) {
              restServer.respond(res, 200, network)
            }
            else if (!pullFlag) {
              restServer.respond(res, 200, network)
            }
            else {
              modelAPI.networks.pullNetwork(network.id)
                .then(result => {
                  appLogger.log('Success pulling from network ' + network.name)
                  modelAPI.networks.pushNetworks(network.networkType.id)
                    .then(ret => {
                      appLogger.log('Success pushing to networks')
                      restServer.respond(res, 200, formatRelationshipsOut(network))
                    }).catch(err => {
                      appLogger.log('Error pushing to networks: ' + err)
                      restServer.respond(res, err)
                    })
                })
                .catch(err => {
                  if (!network.securityData.authorized) {
                    restServer.respond(res, 200, formatRelationshipsOut(network))
                  }
                  else {
                    restServer.respond(res, err)
                  }
                })
            }
          })
      })
      .catch(function (err) {
        appLogger.log('Error creating network' + err)
        restServer.respond(res, err)
      })
  })

  /**
 * @apiDescription Deletes the Network record with the specified id.
 *
 * @api {delete} /api/networks/:id Delete Network
 * @apiGroup Networks
 * @apiPermission System Admin
 * @apiHeader {String} Authorization The Create Session's returned token
 *      prepended with "Bearer "
 * @apiParam (URL Parameters) {Number} id The Network's id
 * @apiVersion 0.1.0
 */
  app.delete('/api/networks/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdminCompany],
  function (req, res, next) {
    var id = parseInt(req.params.id, 10)
    // If the caller is a global admin, we can just delete.
    modelAPI.networks.remove(id).then(function () {
      restServer.respond(res, 204)
    })
      .catch(function (err) {
        appLogger.log('Error deleting network ' + id + ': ' + err)
        restServer.respond(res, err)
      })
  })
  /**
 * Pulls the company records from the network with the specified id.
 * - Only a user with the admin company or the admin of the device's
 *   company can delete an device. TODO: Is this true?
 */
  app.post('/api/networks/:networkId/pull', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var networkId = parseInt(req.params.networkId, 10)
    // If the caller is a global admin, or the device is part of the company
    // admin's company, we can push.
    modelAPI.networks.pullNetwork(networkId).then(function (ret) {
      restServer.respondJson(res, 200, ret)
    }).catch(function (err) {
      appLogger.log('Error pulling from network ' + networkId + ': ' + err)
      restServer.respond(res, err)
    })
  })

  app.post('/api/networks/:networkId/push', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var networkId = parseInt(req.params.networkId, 10)
    // If the caller is a global admin, or the device is part of the company
    // admin's company, we can push.
    modelAPI.networks.pushNetwork(networkId).then(function (ret) {
      restServer.respondJson(res, 200, ret)
    }).catch(function (err) {
      appLogger.log('Error pushing to networks: ' + err)
      restServer.respond(res, err)
    })
  })

  app.get('/api/networks/:networkId/test', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    var networkId = parseInt(req.params.networkId, 10)
    modelAPI.networks.load(networkId)
      .then((network) => {
        modelAPI.networkTypeAPI.test(network, network.securityData).then(() => {
          restServer.respond(res, 200, { status: 'success' })
        }).catch((err) => {
          appLogger.log(err)
          restServer.respond(res, 400, { status: 'failed', message: err.toString() })
        })
      })
      .catch((err) => {
        appLogger.log(err)
        restServer.respond(res, err)
      })
  })

  app.get('/api/oauth/callback', [],
    function (req, res, next) {
      restServer.respondJson(res, 200, {})
    })
}
