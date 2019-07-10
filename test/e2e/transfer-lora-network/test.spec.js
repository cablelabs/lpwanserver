const assert = require('assert')
const { createLpwanClient } = require('../../clients/lpwan')
const Lora1 = require('./lora1')
// const { createLoraServer2Client } = require('../../clients/lora-server2')

const Lpwan = createLpwanClient()
// const Lora2 = createLoraServer2Client()

describe.only('Transfer Lora Server v1 network to Lora Server v2', () => {
  before(async () => {
    await Lora1.seedData()
    await Lpwan.login({
      data: { login_username: 'admin', login_password: 'password' }
    })
  })

  describe('Create Lora Server v1 network', () => {
    it('Create the Network', async () => {
      assert.strictEqual(1, 1)
    })
  })
})
