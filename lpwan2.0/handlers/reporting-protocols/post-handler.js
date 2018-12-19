const request = require('request')

exports.report = async (dataObject, url, appName) => {
  var options = {}
  options.method = 'POST'
  options.uri = url
  options.headers = {}
  options.headers[ 'Content-Type' ] = 'application/json'
  options.headers.appid = appName
  options.json = dataObject
  console.log(options)
  request(options, function (error, response, body) {
    if (error) {
      console.log('Error reporting data (' +
          JSON.stringify(dataObject) +
          ') for ' + appName +
          ' to ' + url +
          ': ' + error)
      throw (error)
    }
    else {
      console.log(body)
      return (response)
    }
  })
}
