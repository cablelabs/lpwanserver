var createError = require('http-errors')
const R = require('ramda')

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
    throw createError(status, err.message, err)
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

module.exports = {
  mutate,
  onFail,
  tryCatch,
  lift
}
