async function pushNetwork (ctx, { network }) {
  await Promise.all([
    ctx.$self.pushApplications({ network, pushDevices: true }),
    ctx.$self.pushDeviceProfiles({ network })
  ])
}

async function pushApplications (ctx, { network, pushDevices }) {
  const where = { networkType: network.networkType }
  for await (let state of ctx.$m.applicationNetworkTypeLink.listAll({ where })) {
    await Promise.all(state.records.map(x => ctx.$self.pushApplication({
      network,
      applicationId: x.application.id,
      pushDevices
    })))
  }
}

async function pushApplication (ctx, { network, applicationId, pushDevices = false }) {
  const application = { id: applicationId }
  try {
    const nwkDeployment = await ctx.$m.networkDeployment.loadByQuery({
      application,
      network: { id: network.id }
    })
    if (nwkDeployment.status !== 'SYNCED') {
      await ctx.$m.networkDeployment.update({ where: { id: nwkDeployment.id }, data: { status: 'UPDATED' } })
    }
  }
  catch (err) {
    if (err.statusCode !== 404) throw err
    await ctx.$m.networkDeployment.create({
      data: {
        status: 'CREATED',
        type: 'APPLICATION',
        meta: { enabled: false },
        network: { id: network.id },
        application
      }
    })
  }
  if (!pushDevices) return
  await ctx.$self.pushApplicationDevices({ network, applicationId })
}

async function pushDeviceProfiles (ctx, { network, pushDevices }) {
  const where = { networkType: network.networkType }
  for await (let state of ctx.$m.deviceProfile.listAll({ where })) {
    await Promise.all(state.records.map(x => ctx.$self.pushDeviceProfile({
      network,
      deviceProfileId: x.id,
      pushDevices
    })))
  }
}

async function pushDeviceProfile (ctx, { network, deviceProfileId, pushDevices = false }) {
  const deviceProfile = { id: deviceProfileId }
  try {
    const nwkDeployment = await ctx.$m.networkDeployment.loadByQuery({
      deviceProfile,
      network: { id: network.id }
    })
    if (nwkDeployment.status !== 'SYNCED') {
      await ctx.$m.networkDeployment.update({ where: { id: nwkDeployment.id }, data: { status: 'UPDATED' } })
    }
  }
  catch (err) {
    if (err.statusCode !== 404) throw err
    await ctx.$m.networkDeployment.create({
      data: {
        status: 'CREATED',
        type: 'DEVICE_PROFILE',
        meta: {},
        network: { id: network.id },
        deviceProfile
      }
    })
  }
  if (!pushDevices) return
  await ctx.$self.pushDeviceProfileDevices({ network, deviceProfileId })
}

async function pushApplicationDevices (ctx, { network, applicationId }) {
  const where = { application: { id: applicationId } }
  for await (let state of ctx.$m.device.listAll({ where })) {
    await Promise.all(state.records.map(x => ctx.$self.pushDevice({
      network,
      deviceId: x.id
    })))
  }
}

async function pushDeviceProfileDevices (ctx, { network, deviceProfileId }) {
  const where = {
    deviceProfile: { id: deviceProfileId },
    networkType: network.networkType
  }
  for await (let state of ctx.$m.deviceNetworkTypeLinks.listAll({ where })) {
    await Promise.all(state.records.map(x => ctx.$self.pushDevice({
      network,
      deviceId: x.device.id
    })))
  }
}

async function pushDevice (ctx, { network, deviceId }) {
  const device = { id: deviceId }
  try {
    const nwkDeployment = await ctx.$m.networkDeployment.loadByQuery({
      device,
      network: { id: network.id }
    })
    if (nwkDeployment.status !== 'SYNCED') {
      await ctx.$m.networkDeployment.update({ where: { id: nwkDeployment.id }, data: { status: 'UPDATED' } })
    }
  }
  catch (err) {
    if (err.statusCode !== 404) throw err
    await ctx.$m.networkDeployment.create({
      data: {
        status: 'CREATED',
        type: 'DEVICE',
        meta: {},
        network: { id: network.id },
        device
      }
    })
  }
}

module.exports = {
  pushNetwork,
  pushApplications,
  pushApplication,
  pushApplicationDevices,
  pushDeviceProfiles,
  pushDeviceProfile,
  pushDeviceProfileDevices,
  pushDevice
}
