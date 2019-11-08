const { applicationNetworkTypeLink } = require('../../../models')
const { pipe, authorize: auth } = require('../openapi-middleware')
const { requestContext } = require('../crud')

const pushApplicationNetworkTypeLink = appNtlModel => async (ctx, req, res) => {
  await appNtlModel.push({
    id: ctx.request.params.id,
    pushDevices: !!ctx.request.query.pushDevices
  }, requestContext(req))
  res.status(204).send()
}

module.exports = {
  pushApplicationNetworkTypeLink,
  handlers: {
    pushApplicationNetworkTypeLink: pipe(
      auth(['ApplicationNetworkTypeLink:push']),
      pushApplicationNetworkTypeLink(applicationNetworkTypeLink)
    )
  }
}
