var { logger } = require('../log')
var restServer
var modelAPI

exports.initialize = function (app, server) {
  restServer = server
  modelAPI = server.modelAPI

  /*********************************************************************
     * Networks API.
     ********************************************************************
    /**
     * Gets the networkProvisioningField definitions for the table and network
     * - Can be called by an admin user or a member of the admin company.
     * - Gets the field definitions needed for the table type to link to the
     *   network.
     * - Returns an array of field description data used to obtain the data
     *   from the user to create a JSON structure to including the
     *   *NetworkTypeLink record for the network.
     */
  app.get('/api/networkProvisioningFields/:table/:networkId',
    [restServer.isLoggedIn,
      restServer.fetchCompany,
      restServer.isAdmin],
    function (req, res, next) {
      // Convert the table name to an id
      var tableName = req.params.table
      var tableId = modelAPI.networkProvisioningFields.provisioningTables[ tableName ]
      if (!tableId) {
        restServer.respond(res, 400, 'Invalid table')
        return
      }

      modelAPI.networkProvisioningFields.retrieveNetworkProvisioningFields(req.params.networkId, tableId).then(function (fields) {
        restServer.respondJson(res, null, fields)
      })
        .catch(function (err) {
          logger.error('Error getting table fields: ', err)
          restServer.respond(res, err)
        })
    })

  /**
     * Gets the networkProvisioningField record with the specified id.
     * - Can be called by a member of the admin company
     */
  app.get('/api/networkProvisioningFields/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdminCompany],
  function (req, res, next) {
    let { id } = req.params
    modelAPI.networkProvisioningFields.retrieveNetworkProvisioningField(id).then(function (npf) {
      restServer.respondJson(res, null, npf)
    })
      .catch(function (err) {
        logger.error('Error getting networkProvisioningField ' + id + ': ', err)
        restServer.respond(res, err)
      })
  })

  /**
     * Creates a new networkProvisioningField record.
     * - A user with an admin company can create a networkProvisioningField.
     * - Body has a networkProtocolId (the protocol that uses this field),
     *   fieldOrder (sort order for data entry of fields), fieldName (name for
     *   the JSON field), fieldLabel (display field description for UI),
     *   fieldType (the backend doesn't much care this is, so long as the front
     *   end and networkProtocol can agree on the data usage), fieldSize (the
     *   size of the data item if applicable), requiredField (is required in the
     *   data for the networkProtocol?  Optional, assumed false), and
     *   provisioningTable (the * part of the link table *NetworkTypeLinks,
     *   expected to be "companies", "applications", or "devices") in the JSON
     *   body.
     * - {
     *     "networkProtocolId": 4,
     *     "fieldOrder": 1,
     *     "fieldName": "login",
     *     "fieldLabel": "User login",
     *     "fieldType": "string",
     *     "fieldSize": 128,
     *     "requiredField": true,
     *     "provisioningTable": "companies"
     *   }
     */
  app.post('/api/networkProvisioningFields', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdminCompany],
  function (req, res, next) {
    var rec = req.body
    // You can't specify an id.
    if (rec.id) {
      restServer.respond(res, 400, "Cannot specify the networkProvisioningField's id in create")
      return
    }

    // Verify that required fields exist.
    if (!rec.networkProtocolId || !rec.fieldOrder || !rec.fieldName ||
             !rec.fieldLabel || !rec.fieldType || !rec.provisioningTable) {
      restServer.respond(res, 400, 'Missing required data')
      return
    }

    // Convert the provisioningTable name to an id.
    var provisioningTableId = modelAPI.networkProvisioningFields.provisioningTables[ rec.provisioningTable ]

    // Do the add.
    modelAPI.networkProvisioningFields.createNetworkProvisioningField(
      rec.networkProtocolId,
      rec.fieldOrder,
      rec.fieldName,
      rec.fieldLabel,
      rec.fieldType,
      rec.fieldSize,
      rec.requiredField,
      provisioningTableId).then(function (rec) {
      var send = {}
      send.id = rec.id
      restServer.respondJson(res, 200, send)
    })
      .catch(function (err) {
        restServer.respond(res, err)
      })
  })

  /**
     * Updates the networkProvisioningField record with the specified id.
     * - Can only be called by a user who is part of an admin company.
     * - Can only change data about the field: fieldOrder, fieldName,
     *   fieldLabel, fieldType, fieldSize, requiredField.  Changing the
     *   provisioningTable or networkProtocol really doesn't make much sense
     *   from a UI perspective.  In those cases, delete and create with the new
     *   fields.
     */
  app.put('/api/networkProvisioningFields/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdminCompany],
  function (req, res) {
    var data = { id: req.params.id }
    // We'll start by getting the networkProvisioningField, as a read is much
    // less expensive than a write, and then we'll be able to tell if
    // anything really changed before we even try to write.
    modelAPI.networkProvisioningFields.retrieveNetworkProvisioningField(data.id).then(function (npf) {
      // Fields that may exist in the request body that can change.  Make
      // sure they actually differ, though.
      var changed = 0
      if ((req.body.fieldOrder) &&
                 (req.body.fieldOrder !== npf.fieldOrder)) {
        data.fieldOrder = req.body.fieldOrder
        ++changed
      }
      if ((req.body.fieldName) &&
                 (req.body.fieldName !== npf.fieldName)) {
        data.fieldName = req.body.fieldName
        ++changed
      }
      if ((req.body.fieldLabel) &&
                 (req.body.fieldLabel !== npf.fieldLabel)) {
        data.fieldLabel = req.body.fieldLabel
        ++changed
      }
      if ((req.body.fieldType) &&
                 (req.body.fieldType !== npf.fieldType)) {
        data.fieldType = req.body.fieldType
        ++changed
      }
      if ((req.body.fieldSize) &&
                 (req.body.fieldSize !== npf.fieldSize)) {
        data.fieldSize = req.body.fieldSize
        ++changed
      }
      if ((req.body.requiredField) &&
                 (req.body.requiredField !== npf.requiredField)) {
        data.requiredField = req.body.requiredField
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
        modelAPI.networkProvisioningFields.updateNetworkProvisioningField(data).then(function (rec) {
          restServer.respond(res, 204)
        })
          .catch(function (err) {
            restServer.respond(res, err)
          })
      }
    })
      .catch(function (err) {
        logger.error('Error getting networkProvisioningField ' + data.id + ': ', err)
        restServer.respond(res, err)
      })
  })

  /**
     * Deletes the networkProvisioningField record with the specified id.
     * - Only a user with the admin company can delete a
     *   networkProvisioningField.
     */
  app.delete('/api/networkProvisioningFields/:id',
    [restServer.isLoggedIn,
      restServer.fetchCompany,
      restServer.isAdminCompany],
    function (req, res, next) {
      let { id } = req.params
      modelAPI.networkProvisioningFields.deleteNetworkProvisioningField(id).then(function () {
        restServer.respond(res, 204)
      })
        .catch(function (err) {
          logger.error('Error deleting networkProvisioningField ' + id + ': ', err)
          restServer.respond(res, err)
        })
    })
}
