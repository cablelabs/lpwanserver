const emitter = require('./lib/emitter')
const $m = require('./models')

emitter.on('networkDeployment:updated', handleNetworkDeploymentUpdated)

async function handleNetworkDeploymentUpdated (networkDeployment) {
  if (networkDeployment.status === 'SYNCED') return
  let meta
  try {
    const network = await $m.network.load({ where: networkDeployment.network })
    switch (networkDeployment.type) {
      case 'APPLICATION':
        meta = await $m.networkProtocol.syncApplication({ network, networkDeployment })
        break
      case 'DEVICE':
        meta = await $m.networkProtocol.syncDevice({ network, networkDeployment })
        break
      case 'DEVICE_PROFILE':
        meta = await $m.networkProtocol.syncDeviceProfile({ network, networkDeployment })
        break
    }
  }
  catch (err) {
    await $m.networkDeployment.update({
      where: { id: networkDeployment.id },
      data: {
        status: 'SYNC_FAILED',
        logs: [...networkDeployment.logs, err.toString()]
      }
    })
    return
  }
  if (networkDeployment.status === 'REMOVED') {
    await $m.networkDeployment.remove({
      where: { id: networkDeployment.id }
    })
  }
  else {
    await $m.networkDeployment.update({
      where: { id: networkDeployment.id },
      data: { status: 'SYNCED', meta }
    })
  }
}
