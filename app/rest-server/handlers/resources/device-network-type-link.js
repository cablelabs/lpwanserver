const { deviceNetworkTypeLink } = require('../../../models')
const { pipe, authorize: auth } = require('../openapi-middleware')
const { requestContext } = require('../crud')

const pushDeviceNetworkTypeLink = devNtlModel => async (ctx, req, res) => {
  await devNtlModel.push({
    id: ctx.request.params.id
  }, requestContext(req))
  res.status(204).send()
}

module.exports = {
  pushDeviceNetworkTypeLink,
  handlers: {
    pushDeviceNetworkTypeLink: pipe(
      auth(['DeviceNetworkTypeLink:push']),
      pushDeviceNetworkTypeLink(deviceNetworkTypeLink)
    )
  }
}
