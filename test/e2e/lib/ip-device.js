const https = require('https')
const R = require('ramda')
const net = require('net')
const uuid = require('uuid')
const { URL } = require('url')

let config = {
  queryTimeout: 5000
}

let server

const state = {
  requestSummaries: [],
  queries: []
}

const tlsOpts = R.pick(['cert', 'key', 'ca'])

const pickRequestSummaryProps = R.pick(['method', 'url', 'headers'])

process.on('message', msg => {
  switch (msg.cmd) {
    case 'createServer': return createServer(msg.data)
    case 'listRequests': return listRequests(msg.data)
    case 'sendRequest': return sendRequest(msg.data)
    default:
      process.send({ error: `Unknown command ${msg.cmd}` })
  }
})

function createServer (data) {
  config = { ...config, ...data, port: parseInt(data.port, 10) }
  server = https.createServer(tlsOpts(config), serverRequestHandler)
  // listen()
}

function listen () {
  server.listen(config.port, err => {
    if (err) return process.send({ error: err.message })
    process.send({ event: 'listening' })
  })
}

function closeServer (cb) {
  server.close(() => {
    process.send({ event: 'closed' })
    cb()
  })
}

function serverRequestHandler (req, res) {
  state.requestSummaries.push({ id: uuid.v4(), ...pickRequestSummaryProps(req) })
  res.writeHead(204)
  res.end()
}

function listRequests ({ id, query }) {
  const queryRecord = { id, query, timestamp: Date.now() }
  state.queries.push(queryRecord)
  respondToQueries([queryRecord])
}

function respondToQueries (queries) {
  const isExpired = R.compose(R.gt(Date.now()), R.add(config.queryTimeout), R.prop('timestamp'))
  if (!queries) queries = state.queries
  const responses = queries.map(x => {
    const found = state.requestSummaries.filter(partialObjectEqual(x.query))
    return found.length ? { ...x, found } : { ...x, isExpired: isExpired(x) }
  })
  const foundOrExpired = filterInFoundOrExpired(responses)
  state.queries = excludeByProp('id', foundOrExpired, state.queries)
  foundOrExpired.forEach(x => {
    process.send({ event: 'queryResult', found: x.found || [] })
  })
}

function sendRequest (data) {
  // const { address, port } = server.address()
  const url = new URL(data.url)
  const requestOpts = {
    ...R.omit(['url', 'body'], data),
    ...tlsOpts(config),
    createConnection () {
      const socket = new net.Socket()
      socket.connect({ host: url.hostname, port: url.port })
      return socket
    }
  }
  const request = https.request(url, requestOpts, res => {
    process.send({ event: 'statusCode', data: res.statusCode })
    res.setEncoding('utf8')
    let body = ''
    res.on('data', x => {
      body += x
    })
    res.on('end', () => {
      process.send({
        event: 'response',
        request: data,
        data: {
          ...R.pick(['statusCode', 'headers'], res),
          body
        }
      })
      // listen()
    })
  })
  request.end(data.body, 'utf8')
}

// *******************************************************
// Helpers
// *******************************************************
const mapProp = prop => R.map(R.prop(prop))

const excludeByProp = R.curry((prop, xs, ys) => {
  const _mapProp = mapProp(prop)
  return R.filter(
    R.compose(R.not, R.contains(R.__, _mapProp(xs)), R.prop(prop)),
    ys
  )
})

const partialObjectEqual = R.curry(function partialObjectEqual (a, b) {
  return R.keys(a).every(x => typeof a[x] === 'object'
    ? partialObjectEqual(a[x], b[x])
    : R.equals(a[x], b[x])
  )
})

const filterInFoundOrExpired = R.filter(R.either(R.prop('found'), R.prop('isExpired')))
