#!/usr/bin/env node

const Lora1 = require('../test/networks/lora-v1')
const Lora2 = require('../test/networks/lora-v2')

async function main () {
  Lora1.network.baseUrl = Lora1.network.baseUrl.replace('chirpstack_app_svr_1:8080', 'localhost:8081')
  Lora2.network.baseUrl = Lora2.network.baseUrl.replace('chirpstack_app_svr:8080', 'localhost:8082')
  await Promise.all([
    Lora1.setup(),
    Lora2.setup()
  ])
}

main().catch(err => {
  if (err) console.error(err.toString())
  process.exit(1)
})
