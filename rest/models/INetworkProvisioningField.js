// Configuration access.
var nconf = require('nconf')

//* *****************************************************************************
// The Network interface.
//* *****************************************************************************
// Maps a provisioningTable name to a numeric value.
var provisioningTables = {}
// Maps a numeric value to the provisioningTable name.
var reverseProvisioningTables = {}

function NetworkProvisioningField () {
  this.impl = require('./dao/' +
                             nconf.get('impl_directory') +
                             '/networkProvisioningFields.js')

  this.provisioningTables = provisioningTables
  this.reverseProvisioningTables = reverseProvisioningTables

  // Load the provisioningTables from the database.
  this.impl.getProvisioningTables().then(function (tableList) {
    for (var i = 0; i < tableList.length; ++i) {
      provisioningTables[ tableList[ i ].type ] = tableList[ i ].id
      reverseProvisioningTables[ tableList[ i ].id ] = tableList[ i ].type
    }
  })
    .catch(function (err) {
      throw 'Failed to load company types: ' + err
    })
}

NetworkProvisioningField.prototype.retrieveNetworkProvisioningFields = function (networkId, tableId) {
  return this.impl.retrieveNetworkProvisioningFields(networkId, tableId)
}

NetworkProvisioningField.prototype.retrieveNetworkProvisioningField = function (id) {
  return this.impl.retrieveNetworkProvisioningField(id)
}

NetworkProvisioningField.prototype.createNetworkProvisioningField = function (networkProtocolId, fieldOrder, fieldName, fieldLabel, fieldType, fieldSize, requiredField, provisioningTableId) {
  return this.impl.createNetworkProvisioningField(networkProtocolId, fieldOrder, fieldName, fieldLabel, fieldType, fieldSize, requiredField, provisioningTableId)
}

NetworkProvisioningField.prototype.updateNetworkProvisioningField = function (record) {
  return this.impl.updateNetworkProvisioningField(record)
}

NetworkProvisioningField.prototype.deleteNetworkProvisioningField = function (id) {
  return this.impl.deleteNetworkProvisioningField(id)
}

module.exports = NetworkProvisioningField
