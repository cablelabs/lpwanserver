'use strict'
const ApplicationModel = require('../../models/application')
const DeviceProfileModel = require('../../models/device-profile')
const DeviceModel = require('../../models/device')
const NetworkModel = require('../../models/network')
const NetworkProtocolModel = require('../../models/network-protocol')

module.exports.pushNetwork = async (network) => {
  let promiseList = []
  promiseList.push(this.pushDeviceProfiles(network))
  promiseList.push(this.pushApplications(network))
  Promise.all(promiseList)
    .then(() => {
      let devicePromiseList = []
      devicePromiseList.push(this.pushDevices(network))
      Promise.all(devicePromiseList)
        .then(pushedResource => {
          console.log(pushedResource, 'info')
          return
        })
        .catch(err => {
          console.log(err, 'error')
          throw (err)
        })
    })
    .catch(err => {
      console.log(err)
      reject(err)
    })
}

module.exports.pushApplications = async (network) => {
    let existingApplications = await modelAPI.applications.retrieveApplications()
    let promiseList = []
    for (let index = 0; index < existingApplications.records.length; index++) {
      promiseList.push(this.pushApplication(sessionData, network, existingApplications.records[index], dataAPI, false))
    }
    Promise.all(promiseList)
      .then(pushedResources => {
        console.log(pushedResources)
        return
      })
      .catch(err => {
        console.log(err)
        throw(err)
      })
}

module.exports.pushApplication = async (network, update = true) => {
      // MISSING LINE OF CODE HERE
      .then(appNetworkId => {
        if (update && appNetworkId) {
          this.updateApplication(sessionData, network, application.id, dataAPI)
            .then(() => {
              resolve()
            })
            .catch(err => {
              console.log(err, 'error')
              reject(err)
            })
        }
        else if (appNetworkId) {
          console.log('Ignoring Application  ' + application.id + ' already on network ' + network.name)
          resolve({localApplication: application.id, remoteApplication: appNetworkId})
        }
        else {
          reject(new Error('Bad things in the Protocol Table'))
        }
      })
      .catch(() => {
        this.addApplication(network, application.id, dataAPI)
          .then((appNetworkId) => {
            console.log('Added application ' + application.id + ' to network ' + network.name)
            resolve({localApplication: application.id, remoteApplication: appNetworkId})
          })
          .catch(err => {
            console.log(err)
            reject(err)
          })
      })
}

module.exports.pushDeviceProfiles = async (network) => {


    let existingDeviceProfiles = await modelAPI.deviceProfiles.retrieveDeviceProfiles()
    let promiseList = []
    for (let index = 0; index < existingDeviceProfiles.records.length; index++) {
      promiseList.push(this.pushDeviceProfile(sessionData, network, existingDeviceProfiles.records[index], dataAPI))
    }
    Promise.all(promiseList)
      .then(pushedResources => {
        console.log(pushedResources)
        resolve()
      })
      .catch(err => {
        console.log(err)
        reject(err)
      })
}

module.exports.pushDeviceProfile = function (sessionData, network, deviceProfile, dataAPI) {


    // See if it already exists
    console.log(deviceProfile, 'info')
    dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeDeviceProfileDataKey(deviceProfile.id, 'dpNwkId'))
      .then(dpNetworkId => {
        console.log(dpNetworkId, 'info')
        if (dpNetworkId) {
          console.log('Ignoring Device Profile  ' + deviceProfile.id + ' already on network ' + network.name)
          resolve({
            localDeviceProfile: deviceProfile.id,
            remoteDeviceProfile: dpNetworkId
          })
        }
        else {
          console.log(dpNetworkId + '')

          reject(new Error('Something bad happened with the Protocol Table'))
        }
      })
      .catch(() => {
        this.addDeviceProfile(sessionData, network, deviceProfile.id, dataAPI)
          .then((remoteId) => {
            console.log('Added Device Profile ' + deviceProfile.id + ' to network ' + network.name)
            resolve({
              localDeviceProfile: deviceProfile.id,
              remoteDeviceProfile: remoteId
            })
          })
          .catch(err => {
            console.log(err)
            reject(err)
          })
      })

}

module.exports.pushDevices = async (network) => {


    let existingDevices = await modelAPI.devices.retrieveDevices()
    let promiseList = []
    for (let index = 0; index < existingDevices.records.length; index++) {
      promiseList.push(this.pushDevice(sessionData, network, existingDevices.records[index], dataAPI, false))
    }
    Promise.all(promiseList)
      .then(pushedResources => {
        console.log(pushedResources)
        resolve(pushedResources)
      })
      .catch(err => {
        console.log(err)
        reject(err)
      })

}

module.exports.pushDevice = function (sessionData, network, device, dataAPI, update = true) {


    // See if it already exists
    dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeDeviceDataKey(device.id, 'devNwkId'))
      .then(devNetworkId => {
        if (update && devNetworkId) {
          console.log('What I expect')
          this.updateDevice(sessionData, network, device.id, dataAPI)
            .then(() => {
              resolve()
            })
            .catch(err => {
              console.log(err, 'error')
              reject(err)
            })
        }
        else if (devNetworkId) {
          console.log('Ignoring Device  ' + device.id + ' already on network ' + network.name)
          resolve({localDevice: device.id, remoteDevice: devNetworkId})
        }
        else {
          reject(new Error('Bad things in the Protocol Table'))
        }
      })
      .catch(() => {
        this.addDevice(sessionData, network, device.id, dataAPI)
          .then((devNetworkId) => {
            console.log('Added Device  ' + device.id + ' to network ' + network.name)
            resolve({localDevice: device.id, remoteDevice: devNetworkId})
          })
          .catch(err => {
            console.log(err)
            reject(err)
          })
      })

}

module.exports.pullNetwork = function (sessionData, network, dataAPI, modelAPI) {
    this.setupOrganization(sessionData, network, modelAPI, dataAPI)
      .then((companyNtl) => {
        let promiseList = []
        promiseList.push(this.pullDeviceProfiles(sessionData, network, modelAPI, companyNtl, dataAPI))
        promiseList.push(this.pullApplications(sessionData, network, modelAPI, dataAPI, companyNtl))

        Promise.all(promiseList)
          .then(pulledResources => {
            console.log(pulledResources)
            let devicePromistList = []
            for (let index in pulledResources[1]) {
              devicePromistList.push(this.pullDevices(sessionData, network, pulledResources[1][index].remoteApplication, pulledResources[1][index].localApplication, pulledResources[0], modelAPI, dataAPI))
              devicePromistList.push(this.pullIntegrations(sessionData, network, pulledResources[1][index].remoteApplication, pulledResources[1][index].localApplication, pulledResources[0], modelAPI, dataAPI))
            }
            Promise.all(devicePromistList)
              .then((devices) => {
                console.log(devices)
                resolve()
              })
              .catch(err => {
                console.log(err)
                reject(err)
              })
          })
          .catch(err => {
            console.log(err)
            reject(err)
          })
      })
}
