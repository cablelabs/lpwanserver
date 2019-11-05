var httpError = require('http-errors')
const R = require('ramda')
const path = require('path')
const Ajv = require('ajv')

function mutate (key, val, data) {
  data[key] = val
  return data
}

async function onFail (status, action) {
  try {
    const result = await action()
    return result
  }
  catch (err) {
    throw httpError(status, err.toString(), err)
  }
}

function tryCatch (promise) {
  return promise.then(
    x => ([null, x]),
    err => ([err])
  )
}

const lift = R.curry(function lift (props, obj) {
  return R.mergeAll([ R.omit(props, obj), ...props.map(x => obj[x]) ])
})

const renameKeys = R.curry((keysMap, obj) =>
  R.reduce((acc, key) => mutate(keysMap[key] || key, obj[key], acc), {}, R.keys(obj))
)

function joinUrl (...args) {
  return args.join('/').replace(/([^:]\/)\/+/g, '$1')
}

// for relative file paths, build a path from the root of the repo
function normalizeFilePath (x) {
  if (!x || typeof x !== 'string') {
    throw new TypeError(`Invalid file path ${x}`)
  }
  return x.charAt(0) === '/' ? x : path.join(__dirname, '../..', x)
}

const getCertificateCn = R.compose(R.path(['subject', 'CN']), R.defaultTo({}))

const preferredWaitRegEx = /wait=(\d+)/g

const getHttpRequestPreferedWaitMs = R.compose(
  R.multiply(1000),
  R.min(600),
  x => parseInt(x, 10),
  R.cond([
    [x => preferredWaitRegEx.test(x), x => (new RegExp(preferredWaitRegEx)).exec(x)[1]],
    [R.T, R.always(0)]
  ]),
  R.toLower,
  R.defaultTo('')
)

const normalizeDevEUI = R.compose(
  R.replace(/[^0-9A-Fa-f]/g, ''),
  R.defaultTo('')
)

function lowerFirst (x) {
  return `${x.charAt(0).toLowerCase()}${x.slice(1)}`
}

function upperFirst (x) {
  return `${x.charAt(0).toUpperCase()}${x.slice(1)}`
}

const parseProp = R.curry(function parseProp (prop, data) {
  if (!data[prop] || typeof data[prop] !== 'string') return data
  return { ...data, [prop]: JSON.parse(data[prop]) }
})

const stringifyProp = R.curry(function stringifyProp (prop, data) {
  if (!data[prop] || typeof data[prop] === 'string') return data
  return { ...data, [prop]: JSON.stringify(data[prop]) }
})

async function attempt (fn, onError, opts = {}) {
  try {
    const result = await fn()
    return result
  }
  catch (err) {
    onError(err)
    if (!opts.catch) throw err
  }
}

attempt.catch = function catchAttempt (fn, onError, opts = {}) {
  return attempt(fn, onError, { ...opts, catch: true })
}

function camelCaseToHyphen (word) {
  return word.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`)
}

function traceError (message, data, err) {
  if (!Array.isArray(err.trace)) {
    err.trace = []
  }
  const item = [message]
  if (data != null) item.push(data)
  err.trace.push(item)
  return err
}

const throwError = R.curry(function throwError (message, data, err) {
  throw traceError(message, data, err)
})

const getUpdates = (rec, data) => R.keys(data).reduce((acc, x) => {
  if (!R.equals(rec[x], data[x])) acc[x] = data[x]
  return acc
}, {})

const ajv = new Ajv()
const validateSchema = (msgPrefix, schema) => {
  const validate = ajv.compile(schema)
  return data => {
    const valid = validate(data)
    if (!valid) throw httpError(400, `${msgPrefix}: ${JSON.stringify(validate.errors)}`)
  }
}

module.exports = {
  mutate,
  onFail,
  tryCatch,
  lift,
  renameKeys,
  joinUrl,
  normalizeFilePath,
  getCertificateCn,
  getHttpRequestPreferedWaitMs,
  normalizeDevEUI,
  lowerFirst,
  upperFirst,
  parseProp,
  stringifyProp,
  attempt,
  camelCaseToHyphen,
  traceError,
  throwError,
  getUpdates,
  validateSchema
}
