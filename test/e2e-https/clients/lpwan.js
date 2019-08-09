const { LpwanServerRestApi, LpwanServerRestApiCache } = require('../../lib/rest-client')
const Axios = require('axios')
const https = require('https')
const path = require('path')
const fs = require('fs')

const caFile = path.join(__dirname, '../../../certs/ca-crt.pem')
const ca = fs.readFileSync(caFile, { encoding: 'utf8' })

const catM1CertFile = path.join(__dirname, '../../../certs/client-catm1-crt.pem')
const catM1Cert = fs.readFileSync(catM1CertFile, { encoding: 'utf8' })
const catM1KeyFile = path.join(__dirname, '../../../certs/client-catm1-key.pem')
const catM1Key = fs.readFileSync(catM1KeyFile, { encoding: 'utf8' })
const catM1DeviceAgent = new https.Agent({ ca, key: catM1Key, cert: catM1Cert })

const nbIotCertFile = path.join(__dirname, '../../../certs/client-nbiot-crt.pem')
const nbIotCert = fs.readFileSync(nbIotCertFile, { encoding: 'utf8' })
const nbIotKeyFile = path.join(__dirname, '../../../certs/client-nbiot-key.pem')
const nbIotKey = fs.readFileSync(nbIotKeyFile, { encoding: 'utf8' })
const nbIotDeviceAgent = new https.Agent({ ca, key: nbIotKey, cert: nbIotCert })

function createLpwanClient () {
  const axios = Axios.create({
    baseURL: `${process.env.LPWANSERVER_URL}/api`,
    httpsAgent: new https.Agent({ ca })
  })

  const cache = {}

  const client = new LpwanServerRestApi({
    axios,
    cache: new LpwanServerRestApiCache({ cache })
  })

  return { client, cache }
}

module.exports = {
  createLpwanClient,
  catM1DeviceAgent,
  nbIotDeviceAgent
}
