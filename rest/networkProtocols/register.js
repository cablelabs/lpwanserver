function registerLora1 (networkProtocolModel) {
  return networkProtocolModel.upsert({
    name: 'LoRa Server',
    networkTypeId: 1,
    protocolHandler: 'LoraOpenSource/v1',
    networkProtocolVersion: '1.0'
  })
}

async function registerLora2 (networkProtocolModel) {
  let me = {
    name: 'LoRa Server',
    networkTypeId: 1,
    protocolHandler: 'LoraOpenSource/v2',
    networkProtocolVersion: '2.0'
  }
  try {
    const { records } = await networkProtocolModel.list({ search: me.name, networkProtocolVersion: '1.0' })
    console.log('REGISTER LORA 2: RECORDS', JSON.stringify(records))
    if (records.length) {
      me.masterProtocol = records[0].id
    }
  }
  catch (err) {
    // ignore error
  }
  await networkProtocolModel.upsert(me)
}

function registerLoriot (networkProtocolModel) {
  return networkProtocolModel.upsert({
    name: 'Loriot',
    networkTypeId: 1,
    protocolHandler: 'Loriot/v4',
    networkProtocolVersion: '4.0'
  })
}

function registerTtnV2 (networkProtocolModel) {
  return networkProtocolModel.upsert({
    name: 'The Things Network',
    networkTypeId: 1,
    protocolHandler: 'TheThingsNetwork/v2',
    networkProtocolVersion: '2.0'
  })
}

module.exports = async function registerNetworkProtocols (networkProtocolModel) {
  await registerLora1(networkProtocolModel)
  await registerLora2(networkProtocolModel)
  await registerLoriot(networkProtocolModel)
  await registerTtnV2(networkProtocolModel)
}
