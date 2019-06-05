function registerLora1 (networkProtocolModel, loraNwkType) {
  return networkProtocolModel.upsert({
    name: 'LoRa Server',
    networkTypeId: loraNwkType.id,
    protocolHandler: 'LoraOpenSource/v1',
    networkProtocolVersion: '1.0'
  })
}

async function registerLora2 (networkProtocolModel, loraNwkType) {
  let me = {
    name: 'LoRa Server',
    networkTypeId: loraNwkType.id,
    protocolHandler: 'LoraOpenSource/v2',
    networkProtocolVersion: '2.0'
  }
  try {
    const { records } = await networkProtocolModel.list({ search: me.name, networkProtocolVersion: '1.0' })
    if (records.length) {
      me.masterProtocolId = records[0].id
    }
  }
  catch (err) {
    // ignore error
  }
  await networkProtocolModel.upsert(me)
}

function registerLoriot (networkProtocolModel, loraNwkType) {
  return networkProtocolModel.upsert({
    name: 'Loriot',
    networkTypeId: loraNwkType.id,
    protocolHandler: 'Loriot/v4',
    networkProtocolVersion: '4.0'
  })
}

function registerTtnV2 (networkProtocolModel, loraNwkType) {
  return networkProtocolModel.upsert({
    name: 'The Things Network',
    networkTypeId: loraNwkType.id,
    protocolHandler: 'TheThingsNetwork/v2',
    networkProtocolVersion: '2.0'
  })
}

function registerIP (networkProtocolModel, ipNwkType) {
  return networkProtocolModel.upsert({
    name: 'IP',
    networkTypeId: ipNwkType.id,
    protocolHandler: 'IP'
  })
}

module.exports = async function registerNetworkProtocols (modelAPI) {
  const [ loraNwkType, ipNwkType ] = await Promise.all([
    modelAPI.networkTypes.loadByName('LoRa'),
    modelAPI.networkTypes.loadByName('IP')
  ])
  await registerLora1(modelAPI.networkProtocols, loraNwkType)
  await registerLora2(modelAPI.networkProtocols, loraNwkType)
  await registerLoriot(modelAPI.networkProtocols, loraNwkType)
  await registerTtnV2(modelAPI.networkProtocols, loraNwkType)
  await registerIP(modelAPI.networkProtocols, ipNwkType)
}
