// Database implementation.
const { prisma, formatInputData, formatRelationshipReferences } = require('../../../lib/prisma')

// Error reporting
var httpError = require('http-errors')

// Utils
const { onFail } = require('../../../lib/utils')

const formatRefsIn = formatRelationshipReferences('in')

//* *****************************************************************************
// ProtocolData database table.
//
// Use by the protocols to store relevant data for their own use.
//* *****************************************************************************

module.exports = {
  createProtocolData,
  retrieveProtocolDataRecord,
  retrieveProtocolData,
  updateProtocolData,
  deleteProtocolData,
  clearProtocolData,
  reverseLookupProtocolData
}

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the protocolData record.
//
// networkId         - the id of the network this data is stored for.
// networkProtocolId - the id of the networktype, linked to the protocol
//                     used.  This is used in case the network changes protocols,
//                     so old data is not confused with new.
// key               - the dataIdentifier.  This identifier is defined by the
//                     network protocol code, and must be unique in that context
//                     across companies/applications/devices/deviceProfiles, etc.
// data              - The string to store under the specified key.  It is up to
//                     the network protocol code to convert to/from whatever data
//                     type to a string for storage.
//
// Returns the promise that will execute the create.
function createProtocolData (networkId, networkProtocolId, dataIdentifier, dataValue) {
  const data = formatInputData({
    networkId,
    networkProtocolId,
    dataIdentifier,
    dataValue
  })
  return prisma.createProtocolData(data).fragment$(fragments.basic)
}

// Retrieve a protocolData record by id.
//
// id - the record id of the protocolData.
//
// Returns a promise that executes the retrieval.
async function retrieveProtocolDataRecord (id) {
  const rec = await onFail(400, () => prisma.protocolData({ id })).fragment$(fragments.basic)
  if (!rec) throw httpError(404, 'ProtocolData not found')
  return rec
}

// Retrieve a protocolData record by .
//
// networkId     - the record id of the network this data is stored for.
// networkTypeId - the record id of the networkType this data is stored for.
// key           - The key for the specific data item.
//
// Returns a promise that executes the retrieval.
async function retrieveProtocolData (networkId, networkProtocolId, key) {
  const where = {
    network: { id: networkId },
    networkProtocol: { id: networkProtocolId },
    dataIdentifier: key
  }
  const records = await prisma.protocolDatas({ where })
  if (!records.length) {
    throw httpError.NotFound()
  }
  return records[0].dataValue
}

// Update the protocolData record.
//
// protocolData - the updated record.  Note that the id must be unchanged
//                from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
function updateProtocolData ({ id, ...data }) {
  if (!id) throw httpError(400, 'No existing ProtocolData ID')
  data = formatInputData(data)
  return prisma.updateProtocolData({ data, where: { id } })
}

// Delete the protocolData record.
//
// id - the id of the protocolData record to delete.
//
// Returns a promise that performs the delete.
function deleteProtocolData (id) {
  return onFail(400, () => prisma.deleteProtocolData({ id }))
}

// Delete the protocolData records with keys that start with the passed string.
//
// networkId     - the record id of the network this data is stored for.
// networkTypeId - the record id of the networkType this data is stored for.
// key           - The key for the specific data item.
//
// Returns a promise that performs the delete.
function clearProtocolData (networkId, networkProtocolId, keyStartsWith) {
  const where = formatRefsIn({
    networkId,
    networkProtocolId,
    dataIdentifier_contains: keyStartsWith
  })
  return prisma.deleteManyProtocolDatas({ where })
}

// Retrieve the protocolData records with keys that start with the passed string
// and have the passed data.
//
// networkId     - the record id of the network this data is stored for.
// networkTypeId - the record id of the networkType this data is stored for.
// key           - The key for the specific data item.
//
// Returns a promise that performs the delete.
function reverseLookupProtocolData (networkId, keyLike, data) {
  const where = formatRefsIn({
    networkId,
    dataIdentifier_contains: keyLike,
    dataValue: data
  })
  return prisma.protocolDatas({ where })
}

const fragments = {
  basic: `fragment Basic on ProtocolData {
    id
    dataIdentifier
    dataValue
    network {
      id
    }
    networkProtocol {
      id
    }
  }`
}
