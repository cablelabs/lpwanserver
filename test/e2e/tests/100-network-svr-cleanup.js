const Loriot = require('../networks/loriot')
const Ttn = require('../networks/ttn')

const describeTTN = process.env.TTN_ENABLED === 'true' ? describe : describe.skip.bind(describe)
const describeLoriot = process.env.LORIOT_ENABLED === 'true' ? describe : describe.skip.bind(describe)

describe('Remove all data created on remote servers', () => {
  describeLoriot('Remove Loriot apps and devices', () => {
    it('Remove Loriot apps and devices', async () => {
      let { apps } = Loriot.client.listApplications(Loriot.network, { page: 1, perPage: 100 })
      let appDevices = await Promise.all(apps.map(async app => {
        const appId = parseInt(app._id, 10)
        const { devices } = await Loriot.client.listDevices(Loriot.network, appId, { page: 1, perPage: 100 })
        return { appId, devices }
      }))
      await Promise.all(appDevices.map(async ({ appId, devices }) => {
        await Promise.all(devices.map(dev => Loriot.client.deleteDevice(Loriot.network, appId, dev.id)))
        await Loriot.client.deleteApplication(Loriot.network, appId)
      }))
    })
  })
  describeTTN('Remove TTN apps and devices', () => {
    it('Remove TTN apps and devices', async () => {
      const deleteApp = async app => {
        try {
          const devices = await Ttn.client.listDevices(Ttn.network, app.id)
          await Promise.all(devices.map(dev => Ttn.client.deleteDevice(Ttn.network, app.id, dev.id)))
          await Ttn.client.unregisterApplication(Ttn.network, app.id)
        }
        catch (err) {
        }
        await Ttn.client.deleteAccountApplication(Ttn.network, app.id)
      }
      let apps = await Ttn.client.listApplications(Ttn.network)
      apps = apps.filter(x => x.id !== 'lpwansvr-e2e-app-hmoxiloq')
      await Promise.all(apps.map(deleteApp))
    })
  })
})
