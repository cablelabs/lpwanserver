const request = require('request-promise-native')

exports.report = async (dataObject, url, appName) => {
  var options = {
    method: 'POST',
    uri: url,
    headers: { appId: appName },
    body: dataObject,
    json: true
  }
  console.log(options)
  try {
    const body = await request(options)
    console.log(body)
    return body
  } catch (err) {
    console.error(`Error reporting data (${JSON.stringify(dataObject)}) for ${appName} to ${url}.`)
    throw err
  }
}
