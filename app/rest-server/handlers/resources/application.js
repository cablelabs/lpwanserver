const { devices } = require('../../../models')
const { pipe, authorize: auth, requestContext } = require('../openapi-middleware')

const bulkCreateDevices = deviceModel => async (_, req, res) => {
  let result = await deviceModel.importDevices({
    ...req.body,
    applicationId: req.params.id
  }, requestContext(req))
  res.status(200).json(result)
}

module.exports = {
  bulkCreateDevices,
  handlers: {
    bulkCreateDevices: pipe(
      auth(['Device:create']),
      bulkCreateDevices(devices)
    )
  }
}
