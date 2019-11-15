const { prisma } = require('../app/generated/prisma-client')
const { seedData } = require('../lib/seeder')

// example
const seeds = [
  {
    id: 'NetworkType',
    create: x => prisma.createNetworkType(x),
    items: [
      {
        id: 'LORA',
        name: 'LoRa'
      },
      {
        id: 'IP',
        name: 'IP'
      }
    ]
  },
  {
    id: 'ReportingProtocol',
    create: x => prisma.createReportingProtocol(x),
    items: [
      {
        id: 'POST',
        name: 'POST',
        protocolHandler: 'postHandler'
      }
    ]
  },
  {
    type: 'User',
    create: x => prisma.createUser(x),
    items: [
      {
        id: 'ADMIN',
        username: 'admin',
        // password is "password"
        pwdHash: '000000100000003238bd33bdf92cfc3a8e7847e377e51ff8a3689913919b39d7dd0fe77c89610ce2947ab0b43a36895510d7d1f2924d84ab',
        email: 'fake@example.com',
        role: 'ADMIN'
      }
    ]
  }
]

seedData(seeds).catch(e => console.error(e))
