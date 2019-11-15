const { deviceProfile } = require('../../../models')
const { pipe, authorize: auth } = require('../openapi-middleware')
const { requestContext } = require('../crud')

const pushDeviceProfile = dpModel => async (ctx, req, res) => {
  await dpModel.push({
    id: ctx.request.params.id,
    pushDevices: !!ctx.request.query.pushDevices
  }, requestContext(req))
  res.status(204).send()
}

module.exports = {
  pushDeviceProfile,
  handlers: {
    pushDeviceProfile: pipe(
      auth(['DeviceProfile:push']),
      pushDeviceProfile(deviceProfile)
    )
  }
}
