const express = require('express')
const https = require('https')
const http = require('http')
const R = require('ramda')
const uuid = require('uuid')
const request = require('request')
const fs = require('fs')

// *******************************************************
// Models
// *******************************************************
// RequestSummary
// {
//   id: String
//   method: String
//   path: String
//   params: Object
//   query: Object
//   headers: Object
//   body: Object,
//   timestamp: String
// }

// QueryResponse
// {
//   id: String
//   query: ExpressRequestQueryObject
//   timestamp: Number
//   response: ExpressResponseObject
// }

// *******************************************************
// Config
// *******************************************************
const defaultConfig = {
  PORT: 8080,
  QUERY_TIMEOUT: 5000,
  NAME: 'RC Server',
  QUERY_RESPONSE_INTERVAL: 2000,
  ACCESS_PATH: '/requests',
  CERT: void 0,
  KEY: void 0,
  CA: void 0
}

const config = R.merge(defaultConfig, R.pick(R.keys(defaultConfig), process.env))
config.PORT = parseInt(config.PORT, 10)

// *******************************************************
// Helpers
// *******************************************************
// Parse nested objects
const parseObjectValues = R.curry((keys, obj) => R.reduce(
  (acc, x) => R.assoc(x, JSON.parse(acc[x]), acc),
  obj,
  keys.filter(R.has(R.__, obj))
))

const mapProp = prop => R.map(R.prop(prop))

const excludeByProp = R.curry((prop, xs, ys) => {
  const _mapProp = mapProp(prop)
  return R.filter(
    R.compose(R.not, R.contains(R.__, _mapProp(xs)), R.prop(prop)),
    ys
  )
})

// For each QueryResponse, attempt to find a match in the requestSummaries list
// If found, call QueryResponse.resolve with the match
// If not found and expired, call QueryResponse.reject with a NotFound error
// Remove all found or expired QueryResponses from state
function resolveFoundOrExpiredQueries (state, queryTimeout) {
  return queryResponses => {
    const isExpired = R.compose(R.gt(Date.now()), R.add(queryTimeout), R.prop('timestamp'))
    if (!queryResponses) queryResponses = state.queryResponses
    const responses = queryResponses.map(x => {
      const found = state.requestSummaries.filter(partialObjectEqual(x.query))
      return found.length ? { ...x, found } : { ...x, isExpired: isExpired(x) }
    })
    const foundOrExpired = filterInFoundOrExpired(responses)
    state.queryResponses = excludeByProp('id', foundOrExpired, state.queryResponses)
    foundOrExpired.forEach(x => {
      x.response.json(x.found || [])
    })
  }
}

// return true if the equivalent of the first object
// is contained in the second object
const partialObjectEqual = R.curry(function partialObjectEqual (a, b) {
  return R.keys(a).every(x => typeof a[x] === 'object'
    ? partialObjectEqual(a[x], b[x])
    : R.equals(a[x], b[x])
  )
})

const filterInFoundOrExpired = R.filter(R.either(R.prop('found'), R.prop('isExpired')))

const pickRequestSummaryProps = R.pick(
  ['method', 'path', 'params', 'query', 'headers', 'body']
)

const parseQueryObjects = parseObjectValues(['params', 'query', 'headers', 'body'])

// *******************************************************
// Express middleware/handlers
// *******************************************************
// Function for querying requests received by the server
// These requests are excluded from the request queue
// If not found, the request is kept open
const listRequests = R.curry(function listRequests (state, respondToQueries, req, res) {
  const query = parseQueryObjects(req.query)
  const queryResponse = { id: uuid.v4(), query, timestamp: Date.now(), response: res }
  state.queryResponses.push(queryResponse)
  respondToQueries([queryResponse])
})

// Push a RequestSummary onto the queue for each request
// Respond with 204 to all requests
const queueRequest = R.curry(function queueRequest (state, req, res) {
  state.requestSummaries.push({ id: uuid.v4(), ...pickRequestSummaryProps(req) })
  res.status(204).end()
})

// Use req.body as the options for the request library
// Pipe the response back to the client
function proxyRequest (req, res) {
  return request(req.body).pipe(res)
}

// *******************************************************
// Express App
// *******************************************************
let tlsOpts = {}
const useTls = config.CERT && config.KEY
if (useTls) {
  tlsOpts.cert = fs.readFileSync(config.CERT)
  tlsOpts.key = fs.readFileSync(config.KEY)
  if (config.CA) tlsOpts.ca = fs.readFileSync(config.CA)
}

function createRcServer () {
  const state = {
    requestSummaries: [],
    queryResponses: []
  }

  const respondToQueries = resolveFoundOrExpiredQueries(state, config.QUERY_TIMEOUT)

  const app = express()

  app.use(express.json())
  app.get(config.ACCESS_PATH, listRequests(state, respondToQueries))
  app.post(config.ACCESS_PATH, proxyRequest)
  app.use(queueRequest(state))

  const server = useTls
    ? https.createServer(tlsOpts, app)
    : http.createServer({}, app)

  server.listen({ port: config.PORT }, err => {
    if (err) throw err
    console.info(`${config.NAME} listening on port ${config.PORT}!`)
    setInterval(respondToQueries, config.QUERY_RESPONSE_INTERVAL)
  })
}

createRcServer()
