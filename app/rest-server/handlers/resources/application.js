const { device } = require('../../../models')
const { pipe, authorize: auth } = require('../openapi-middleware')
const { requestContext } = require('../crud')

const bulkCreateDevices = deviceModel => async (ctx, req, res) => {
  let result = await deviceModel.importDevices({
    ...ctx.request.requestBody,
    applicationId: ctx.request.params.id
  }, requestContext(req))
  res.status(200).json(result)
}

module.exports = {
  bulkCreateDevices,
  handlers: {
    bulkCreateDevices: pipe(
      auth(['Device:create']),
      bulkCreateDevices(device)
    )
  }
}
