// Configuration access.
var nconf = require('nconf')
var NetworkProtocolDataAccess = require('../networkProtocols/networkProtocolDataAccess')
var appLogger = require('../lib/appLogger')
const R = require('ramda')

//* *****************************************************************************
// The Network interface.
//* *****************************************************************************
var modelAPI

function Network (server) {
  this.impl = require('./dao/' +
                             nconf.get('impl_directory') +
                             '/networks.js')
  modelAPI = server
}

Network.prototype.retrieveNetworks = function (options, fragment) {
  let me = this
  return new Promise(async function (resolve, reject) {
    try {
      let ret = await me.impl.retrieveNetworks(options, fragment)
      let dataAPI = new NetworkProtocolDataAccess(modelAPI, 'INetwork Retrieve bulk')
      // Don't do a forEach or map here.  We need this done NOW, so it
      // is converted for other code.
      // ^^ forEach and map are synchronous
      for (let i = 0; i < ret.records.length; ++i) {
        let rec = ret.records[ i ]
        if (rec.securityData) {
          let k = await dataAPI.getProtocolDataForKey(
            rec.id,
            rec.networkProtocol.id,
            genKey(rec.id))
          rec.securityData = await dataAPI.access(rec, rec.securityData, k)
        }
      };

      resolve(ret)
    }
    catch (err) {
      reject(err)
    }
  })
}

Network.prototype.retrieveNetwork = function (id, fragment) {
  let me = this
  return new Promise(async function (resolve, reject) {
    try {
      let ret = await me.impl.retrieveNetwork(id, fragment)
      if (ret.securityData) {
        let dataAPI = new NetworkProtocolDataAccess(modelAPI, 'INetwork Retrieve')
        let k = await dataAPI.getProtocolDataForKey(id,
          ret.networkProtocol.id,
          genKey(id))
        ret.securityData = await dataAPI.access(ret, ret.securityData, k)
        let networkProtocol = await modelAPI.networkProtocols.retrieveNetworkProtocol(ret.networkProtocol.id)
        ret.masterProtocol = networkProtocol.masterProtocol
      }
      resolve(ret)
    }
    catch (err) {
      reject(err)
    }
  })
}

async function authorizeAndTest (network, modelAPI, k, me, dataAPI) {
  if (network.securityData.authorized) {
    return network
  }
  try {
    const connection = await modelAPI.networkTypeAPI.connect(network, network.securityData)
    if (connection instanceof Object) {
      Object.assign(network.securityData, connection)
    }
    else {
      network.securityData.access_token = connection
    }
    network.securityData.authorized = true
    try {
      await modelAPI.networkTypeAPI.test(network, network.securityData)
      appLogger.log('Test Success ' + network.name, 'info')
      network.securityData.authorized = true
      network.securityData.message = 'ok'
    }
    catch (err) {
      appLogger.log('Test of ' + network.name + ': ' + err)
      network.securityData.authorized = false
      network.securityData.message = err.toString()
    }
    finally {
      return network
    }
  }
  catch (err) {
    if (err.code === 42) return network
    appLogger.log('Connection of ' + network.name + ' Failed: ' + err)
    let errorMessage = {}
    if (err === 301 || err === 405 || err === 404) {
      errorMessage = new Error('Invalid URI to the ' + network.name + ' Network: "' + network.baseUrl + '"')
    }
    else if (err === 401) {
      errorMessage = new Error('Authentication not recognized for the ' + network.name + ' Network')
    }
    else {
      errorMessage = new Error('Server Error on ' + network.name + ' Network:')
    }
    network.securityData.authorized = false
    network.securityData.message = errorMessage.toString()
    return network
  }
}

Network.prototype.createNetwork = async function createNetwork (data) {
  let dataAPI = new NetworkProtocolDataAccess(modelAPI, 'INetwork Create')
  let k = dataAPI.genKey()
  if (data.securityData) {
    const securityDataDefaults = {
      authorized: false,
      message: 'Pending Authorization',
      enabled: true
    }
    data.securityData = R.merge(securityDataDefaults, data.securityData)
    data.securityData = dataAPI.hide(null, data.securityData, k)
  }
  let record = await this.impl.createNetwork(data)
  if (record.securityData) {
    dataAPI.putProtocolDataForKey(record.id, data.networkProtocolId, genKey(record.id), k)
    record.securityData = dataAPI.access(null, record.securityData, k)
    const finalNetwork = await authorizeAndTest(record, modelAPI, k, this, dataAPI)
    finalNetwork.securityData = dataAPI.hide(null, finalNetwork.securityData, k)
    record = await this.impl.updateNetwork(finalNetwork)
  }
  return record
}

Network.prototype.updateNetwork = async function updateNetwork (record) {
  let dataAPI = new NetworkProtocolDataAccess(modelAPI, 'INetwork Update')
  const old = await this.retrieveNetwork(record.id, 'internal')
  const k = await dataAPI.getProtocolDataForKey(record.id, old.networkProtocol.id, genKey(record.id))
  if (!record.securityData) record.securityData = old.securityData
  const finalNetwork = await authorizeAndTest(record, modelAPI, k, this, dataAPI)
  appLogger.log(finalNetwork, 'debug')
  finalNetwork.securityData = dataAPI.hide(null, finalNetwork.securityData, k)
  let masterProtocol = finalNetwork.masterProtocol
  delete finalNetwork.masterProtocol
  const rec = await this.impl.updateNetwork(finalNetwork)
  rec.masterProtocol = masterProtocol
  return rec
}

Network.prototype.deleteNetwork = function (id) {
  let me = this
  return new Promise(async function (resolve, reject) {
    try {
      let dataAPI = new NetworkProtocolDataAccess(modelAPI, 'INetwork Delete')
      let old = await me.impl.retrieveNetwork(id)
      await dataAPI.deleteProtocolDataForKey(id,
        old.networkProtocol.id,
        genKey(id))
      let ret = await me.impl.deleteNetwork(id)
      resolve(ret)
    }
    catch (err) {
      reject(err)
    }
  })
}

// Pull the organization, applications, device profiles, and devices record.
//
// networkId - the network to be pulled from.
//
// Returns a promise that executes the pull.
Network.prototype.pullNetwork = async function pullNetwork (networkId) {
  try {
    let network = await this.retrieveNetwork(networkId, 'internal')
    if (!network.securityData.authorized) {
      throw new Error('Network is not authorized.  Cannot pull')
    }
    let networkType = await modelAPI.networkTypes.retrieveNetworkType(network.networkType.id)
    var npda = new NetworkProtocolDataAccess(modelAPI, 'Pull Network')
    npda.initLog(networkType, network)
    appLogger.log(network)
    let result = await modelAPI.networkProtocolAPI.pullNetwork(npda, network, modelAPI)
    appLogger.log('Success pulling from Network : ' + networkId)
    return result
  }
  catch (err) {
    appLogger.log('Error pulling from Network : ' + networkId + ' ' + err)
    throw err
  }
}

Network.prototype.pushNetworks = function (networkTypeId) {
  let me = this
  return new Promise(async function (resolve, reject) {
    try {
      let networks = await me.retrieveNetworks({ networkTypeId: networkTypeId }, 'internal')
      let networkType = await modelAPI.networkTypes.retrieveNetworkTypes(networkTypeId)
      var npda = new NetworkProtocolDataAccess(modelAPI, 'Push Network')
      npda.initLog(networkType, networks)
      appLogger.log(networks)

      let promiseList = []
      for (let i = 0; i < networks.records.length; ++i) {
        if (networks.records[i].securityData.authorized) {
          promiseList.push(modelAPI.networkProtocolAPI.pushNetwork(npda, networks.records[i], modelAPI))
        }
      }
      Promise.all(promiseList)
        .then(results => {
          appLogger.log('Success pushing to Networks')
          resolve()
        })
        .catch(err => {
          appLogger.log('Error pushing to Networks : ' + ' ' + err)
          reject(err)
        })
    }
    catch (err) {
      appLogger.log('Error pushing to Networks : ' + ' ' + err)
      reject(err)
    }
  })
}

Network.prototype.pushNetwork = function (networkId) {
  let me = this
  return new Promise(async function (resolve, reject) {
    try {
      appLogger.log(networkId)
      let network = await me.retrieveNetwork(networkId, 'internal')
      let networkType = await modelAPI.networkTypes.retrieveNetworkTypes(network.networkType.id)
      var npda = new NetworkProtocolDataAccess(modelAPI, 'Push Network')
      npda.initLog(networkType, network)
      appLogger.log(network)
      let result = await modelAPI.networkProtocolAPI.pushNetwork(npda, network, modelAPI)
      appLogger.log('Success pushing to Network : ' + networkId)
      resolve(result)
    }
    catch (err) {
      appLogger.log('Error pushing to Network : ' + networkId + ' ' + err)
      reject(err)
    }
  })
}

const genKey = function (networkId) {
  return 'nk' + networkId
}

module.exports = Network
