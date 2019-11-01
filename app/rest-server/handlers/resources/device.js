const { device, application, network, networkProtocol } = require('../../../models')
const httpError = require('http-errors')
const { pipe, authorize } = require('../openapi-middleware')
const { getCertificateCn, getHttpRequestPreferedWaitMs, normalizeDevEUI } = require('../../../lib/utils')
const { sub: redisSub } = require('../../../lib/redis')
const { log } = require('../../../lib/log')
const { requestContext } = require('../crud')

const sendUnicastDownlink = model => async (ctx, req, res) => {
  const logs = await model.passDataToDevice({
    deviceId: ctx.request.params.id,
    data: ctx.request.requestBody
  }, requestContext(req))
  res.status(200).json(logs)
}

const sendNetworkUplink = (models) => async (ctx, req, res) => {
  const { networkId, applicationId } = ctx.request.params
  const network = await models.network.load({ where: { id: networkId } })
  const result = await models.networkProtocol.relayUplink({
    network,
    applicationId,
    data: ctx.request.requestBody
  })
  if (result && typeof result !== 'string') JSON.stringify(result)
  res.status(result ? 200 : 204).send(result)
}

const listDownlink = model => async (_, req, res) => {
  const devEUI = getCertificateCn(req.connection.getPeerCertificate())
  if (!devEUI) throw httpError(401, 'Device EUI must be the subject CN of the client certificate')
  const normDevEui = normalizeDevEUI(devEUI)
  try {
    const waitMs = getHttpRequestPreferedWaitMs(req.get('prefer'))
    const downlinks = await model.listDownlinks(devEUI)
    if (downlinks.length || !waitMs) {
      res.status(200).json(downlinks)
      return
    }
    // set request timeout to waitMs
    req.connection.setTimeout(waitMs)
    req.connection.removeAllListeners('timeout')

    redisSub.on('message', async channel => {
      if (channel !== `downlink_received:${normDevEui}`) return
      redisSub.unsubscribe(`downlink_received:${normDevEui}`)
      let downlinks = await model.listDownlinks(devEUI)
      res.status(200).json(downlinks)
      // put timeout back at default 2min
      req.connection.setTimeout(120000)
    })

    redisSub.subscribe(`downlink_received:${normDevEui}`)

    req.connection.on('timeout', () => {
      redisSub.unsubscribe(`downlink_received:${normDevEui}`)
      res.status(200).json([])
      req.connection.end()
    })
  }
  catch (err) {
    log.error(`Error getting downlinks for ip device ${devEUI}`, err)
    res.status(500).send(err.toString())
    req.connection.end()
  }
}

const sendUplink = model => async (ctx, req, res) => {
  const devEUI = getCertificateCn(req.connection.getPeerCertificate())
  if (!devEUI) throw httpError(401, 'Device EUI must be the subject CN of the client certificate')
  model.receiveIpDeviceUplink(devEUI, ctx.request.requestBody)
  res.status(204).send()
}

module.exports = {
  sendUnicastDownlink,
  sendNetworkUplink,
  listDownlink,
  sendUplink,
  handlers: {
    sendUnicastDownlink: pipe(
      authorize(['Device:load']),
      sendUnicastDownlink(device)
    ),
    sendNetworkUplink: sendNetworkUplink({ application, network, networkProtocol }),
    listDownlink: listDownlink(device),
    sendUplink: sendUplink(device)
  }
}
