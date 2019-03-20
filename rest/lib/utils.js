var createError = require('http-errors')

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

module.exports = {
  mutate,
  onFail,
  tryCatch
}
