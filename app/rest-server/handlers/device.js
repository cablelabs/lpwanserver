const { devices } = require('../../models')
const { formatRelationshipsOut } = require('../../lib/prisma')
const httpError = require('http-errors')
const { pipe, authorize: auth, parsePaginationQuery } = require('../middleware/openapi-backend')
const { getCertificateCn, getHttpRequestPreferedWaitMs, normalizeDevEUI } = require('../../lib/utils')
const { redisSub } = require('../../lib/redis')
const { logger } = require('../../log')

module.exports = {
  createDevice: pipe(
    auth(['Device:create']),
    createDevice
  ),
  listDevices: pipe(
    auth(['Device:list']),
    parsePaginationQuery,
    listDevices
  ),
  loadDevice: pipe(
    auth(['Device:load']),
    loadDevice
  ),
  updateDevice: pipe(
    auth(['Device:update']),
    updateDevice
  ),
  removeDevice: pipe(
    auth(['Device:remove']),
    removeDevice
  ),
  sendDownlink: pipe(
    auth('Device:read'),
    sendDownlink
  ),
  listIpDeviceDownlinks,
  sendIpDeviceUplink
}

async function createDevice (_, req, res) {
  const rec = await devices.create(req.body)
  res.status(201).json({ id: rec.id })
}

async function listDevices (_, req, res) {
  const [ recs, totalCount ] = await devices.list(req.query, { includeTotal: true })
  res.status(200).json({ records: recs.map(formatRelationshipsOut), totalCount })
}

async function loadDevice (_, req, res) {
  const rec = await devices.load(req.params.id)
  res.status(200).json(formatRelationshipsOut(rec))
}

async function updateDevice (_, req, res) {
  if (req.body.application.id) {
    const device = await devices.load(req.params.id)
    if (req.body.applicationId !== device.application.id && req.user.role !== 'ADMIN') {
      throw new httpError.Forbidden()
    }
  }
  await devices.update({ id: req.params.id, ...req.body })
  res.status(204).send()
}

async function removeDevice (_, req, res) {
  await devices.remove(req.params.id)
  res.status(204).send()
}

async function sendDownlink (_, req, res) {
  const logs = await devices.passDataToDevice(req.params.id, req.body)
  res.status(200).json(logs)
}

async function receiveUplink (_, req, res) {
  await applications.passDataToApplication(
    req.params.applicationId,
    req.params.networkId,
    req.body
  )
  res.status(204).send()
}

async function listIpDeviceDownlinks (_, req, res) {
  const devEUI = getCertificateCn(req.connection.getPeerCertificate())
  if (!devEUI) throw httpError(401, 'Device EUI must be the subject CN of the client certificate')
  const normDevEui = normalizeDevEUI(devEUI)
  try {
    const waitMs = getHttpRequestPreferedWaitMs(req.get('prefer'))
    const downlinks = await devices.listIpDeviceDownlinks(devEUI)
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
      let downlinks = await devices.listIpDeviceDownlinks(devEUI)
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
    logger.error(`Error getting downlinks for ip device ${devEUI}`, err)
    res.status(500).send(err.toString())
    req.connection.end()
  }
}

async function sendIpDeviceUplink (_, req, res) {
  const devEUI = getCertificateCn(req.connection.getPeerCertificate())
  if (!devEUI) throw httpError(401, 'Device EUI must be the subject CN of the client certificate')
  devices.receiveIpDeviceUplink(devEUI, req.body)
  res.status(204).send()
}
