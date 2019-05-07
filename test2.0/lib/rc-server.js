const express = require('express')
const R = require('ramda')
const uuid = require('uuid')

// *******************************************************
// Configuration
// *******************************************************
const {
  PORT = 8080,
  MAX_REQUEST_AGE = 30000
} = process.env

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
//
// QueryResponse
// {
//   id: String
//   response: ExpressResponseObject
//   query: RequestSummary
//   timestamp: Number
// }

// *******************************************************
// State
// *******************************************************
const state = {
  requestSummaries: [],
  queryResponses: []
}

// *******************************************************
// Express middleware/handlers
// *******************************************************
// Endpoint for querying requests received by the server
// These requests are excluded from the request queue
// If not found, the request is kept open
const requestQueryHandler = R.curry(function requestQueryHandler (state, req, res) {
  const queryResponse = { id: uuid.v4(), response: res, query: req.body, timestamp: Date.now() }
  state.queryResponses.push(queryResponse)
  respondToQueries([queryResponse])
})

// Push a RequestSummary onto the queue for each request
// Respond with 204 to all requests
const queueRequest = R.curry(function queueRequest (state, req, res) {
  state.requestSummaries.push({ id: uuid.v4(), ...pickRequestProps(req) })
  res.status(204).end()
})

// *******************************************************
// Helpers
// *******************************************************
function resolveFoundOrExpiredQueries (state, maxAge) {
  return queryResponses => {
    const isExpired = R.compose(R.gt(Date.now()), R.add(maxAge), R.prop('timestamp'))
    if (!queryResponses) queryResponses = state.queryResponses
    const responses = queryResponses.map(qr => {
      const found = state.requestSummaries.filter(partialObjectEqual(qr.query))
      if (found) return { ...qr, found }
      return { ...qr, isExpired: isExpired(qr) }
    })
    const removeIds = idsOfQueryResponsesToRemove(responses)
    state.queryResponses = state.queryResponses.filter(x => !removeIds.includes(x.id))
    responses.forEach(x => {
      if (x.found) return x.response.json(x.found)
      x.response.status(404).end()
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

const pickRequestProps = R.pick(['method', 'path', 'params', 'query', 'headers', 'body'])

const idsOfQueryResponsesToRemove = R.compose(
  R.map(R.prop('id')),
  R.filter(R.either(R.prop('found'), R.prop('isExpired')))
)

// *******************************************************
// Express App
// *******************************************************
const app = express()
const respondToQueries = resolveFoundOrExpiredQueries(state, MAX_REQUEST_AGE)
app.post('/request-query', requestQueryHandler(state))
app.use(queueRequest(state))
app.listen(PORT, () => console.log(`RC Server listening on port ${PORT}!`))
setInterval(respondToQueries, 5000)
