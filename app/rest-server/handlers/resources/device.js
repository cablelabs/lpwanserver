const { devices, applications } = require('../../../models')
const httpError = require('http-errors')
const { pipe, authorize, requestContext } = require('../openapi-middleware')
const { getCertificateCn, getHttpRequestPreferedWaitMs, normalizeDevEUI } = require('../../../lib/utils')
const { sub: redisSub } = require('../../../lib/redis')
const { log } = require('../../../lib/log')

const sendUnicastDownlink = model => async (_, req, res) => {
  const logs = await model.passDataToDevice(req.params.id, req.body, requestContext(req))
  res.status(200).json(logs)
}

const sendNetworkUplink = applicationModel => async (_, req, res) => {
  await applicationModel.passDataToApplication(
    req.params.applicationId,
    req.params.networkId,
    req.body
  )
  res.status(204).send()
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

const sendUplink = model => async (_, req, res) => {
  const devEUI = getCertificateCn(req.connection.getPeerCertificate())
  if (!devEUI) throw httpError(401, 'Device EUI must be the subject CN of the client certificate')
  model.receiveIpDeviceUplink(devEUI, req.body)
  res.status(204).send()
}

module.exports = {
  sendUnicastDownlink,
  sendNetworkUplink,
  listDownlink,
  sendUplink,
  handlers: {
    sendUnicastDownlink: pipe(
      authorize('Device:read'),
      sendUnicastDownlink(devices)
    ),
    sendNetworkUplink: sendNetworkUplink(applications),
    listDownlink: listDownlink(devices),
    sendUplink: sendUplink(devices)
  }
}
