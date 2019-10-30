function registerLora1 (networkProtocolModel, loraNwkType) {
  return networkProtocolModel.upsert({ data: {
    name: 'LoRa Server',
    networkTypeId: loraNwkType.id,
    protocolHandler: 'LoraOpenSource/v1',
    networkProtocolVersion: '1.0'
  } })
}

async function registerLora2 (networkProtocolModel, loraNwkType) {
  let me = {
    name: 'LoRa Server',
    networkTypeId: loraNwkType.id,
    protocolHandler: 'LoraOpenSource/v2',
    networkProtocolVersion: '2.0'
  }
  const [records] = await networkProtocolModel.list({
    where: { search: me.name, networkProtocolVersion: '1.0' }
  })
  if (records.length) {
    me.masterProtocolId = records[0].id
  }
  await networkProtocolModel.upsert({ data: me })
}

function registerLoriot (networkProtocolModel, loraNwkType) {
  return networkProtocolModel.upsert({ data: {
    name: 'Loriot',
    networkTypeId: loraNwkType.id,
    protocolHandler: 'Loriot/v4',
    networkProtocolVersion: '4.0'
  } })
}

function registerTtnV2 (networkProtocolModel, loraNwkType) {
  return networkProtocolModel.upsert({ data: {
    name: 'The Things Network',
    networkTypeId: loraNwkType.id,
    protocolHandler: 'TheThingsNetwork/v2',
    networkProtocolVersion: '2.0'
  } })
}

function registerIP (networkProtocolModel, ipNwkType) {
  return networkProtocolModel.upsert({ data: {
    name: 'IP',
    networkTypeId: ipNwkType.id,
    protocolHandler: 'IP'
  } })
}

module.exports = async function registerNetworkProtocols (models) {
  const [ loraNwkType, ipNwkType ] = await Promise.all([
    models.networkType.load({ where: { name: 'LoRa' } }),
    models.networkType.load({ where: { name: 'IP' } })
  ])
  await registerLora1(models.networkProtocol, loraNwkType)
  await registerLora2(models.networkProtocol, loraNwkType)
  await registerLoriot(models.networkProtocol, loraNwkType)
  await registerTtnV2(models.networkProtocol, loraNwkType)
  await registerIP(models.networkProtocol, ipNwkType)
}
