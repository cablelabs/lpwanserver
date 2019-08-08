const express = require('express')
const R = require('ramda')
const uuid = require('uuid')
const httpErrors = require('http-errors')

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
const pickRequestSummaryProps = R.pick(
  ['method', 'path', 'params', 'query', 'headers', 'body']
)

// QueryResponse
// {
//   id: String
//   query: RequestSummary
//   timestamp: Number
//   resolve: Function
//   reject: Function
// }

module.exports = function createRcServer ({ port, maxRequestAge }) {
  return new Promise((resolve, reject) => {
    // State
    const state = {
      requestSummaries: [],
      queryResponses: []
    }

    const app = express()
    app.use(express.json())
    const respondToQueries = resolveFoundOrExpiredQueries(state, maxRequestAge)
    app.use(queueRequest(state))
    app.listen(port, err => {
      if (err) return reject(err)
      console.log(`RC Server listening on port ${port}!`)
      setInterval(respondToQueries, 5000)
      resolve({
        port,
        app,
        listRequests: listRequests(state, respondToQueries)
      })
    })
  })
}

// *******************************************************
// Express middleware/handlers
// *******************************************************
// Function for querying requests received by the server
// These requests are excluded from the request queue
// If not found, the request is kept open
const listRequests = R.curry(function listRequests (state, respondToQueries, query) {
  return new Promise((resolve, reject) => {
    const queryResponse = { id: uuid.v4(), query, timestamp: Date.now(), resolve, reject }
    state.queryResponses.push(queryResponse)
    respondToQueries([queryResponse])
  })
})

// Push a RequestSummary onto the queue for each request
// Respond with 204 to all requests
const queueRequest = R.curry(function queueRequest (state, req, res) {
  state.requestSummaries.push({ id: uuid.v4(), ...pickRequestSummaryProps(req) })
  res.status(204).end()
})

// *******************************************************
// Helpers
// *******************************************************

// For each QueryResponse, attempt to find a match in the requestSummaries list
// If found, call QueryResponse.resolve with the match
// If not found and expired, call QueryResponse.reject with a NotFound error
// Remove all found or expired QueryResponses from state
function resolveFoundOrExpiredQueries (state, maxAge) {
  return queryResponses => {
    const isExpired = R.compose(R.gt(Date.now()), R.add(maxAge), R.prop('timestamp'))
    if (!queryResponses) queryResponses = state.queryResponses
    const responses = queryResponses.map(qr => {
      const found = state.requestSummaries.filter(partialObjectEqual(qr.query))
      if (found.length) return { ...qr, found }
      return { ...qr, isExpired: isExpired(qr) }
    })
    const removeIds = idsOfQueryResponsesToRemove(responses)
    state.queryResponses = state.queryResponses.filter(x => !removeIds.includes(x.id))
    responses.forEach(x => {
      if (x.found) return x.resolve(x.found)
      x.reject(httpErrors.NotFound())
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

// Return the IDs of objects who have either 'found' or 'isExpired' props that are true
const idsOfQueryResponsesToRemove = R.compose(
  R.map(R.prop('id')),
  R.filter(R.either(R.prop('found'), R.prop('isExpired')))
)
