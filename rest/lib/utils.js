var createError = require('http-errors')

function mutate (key, val, data) {
  data[key] = val
  return data
}

async function onFail (status, action) {
  try {
    const result = await action()
    return result
  } catch (err) {
    throw createError(status, err.message, err)
  }
}

module.exports = {
  mutate,
  onFail
}
