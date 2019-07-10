const { LpwanServerRestApi, LpwanServerRestApiCache } = require('../../rest-client')
const Axios = require('axios')
const https = require('https')
const path = require('path')
const fs = require('fs')

const caFile = path.join(__dirname, '../../certs/ca-crt.pem')
const ca = fs.readFileSync(caFile, { encoding: 'utf8' })

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
  createLpwanClient
}
