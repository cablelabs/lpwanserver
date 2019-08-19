const { prisma } = require('../app/generated/prisma-client')
const createRecords = require('./lib/seed-util')

// example
const seeds = [
  {
    type: 'NetworkType',
    plural: 'NetworkTypes',
    bodyList: [
      {
        id: 'LORA10',
        name: 'LoRa',
        version: '1.0'
      },
      {
        id: 'LORA11',
        name: 'LoRa',
        version: '1.1'
      },
      {
        id: 'IP',
        name: 'IP'
      }
    ]
  },
  {
    type: 'ReportingProtocol',
    plural: 'ReportingProtocols',
    bodyList: [
      {
        id: 'HTTPPOST',
        name: 'HTTP_POST',
        displayName: 'HTTP POST'
      }
    ]
  },
  {
    type: 'User',
    plural: 'Users',
    bodyList: [
      {
        id: 'ADMIN',
        username: 'admin',
        // password is "password"
        passwordHash: '000000100000003238bd33bdf92cfc3a8e7847e377e51ff8a3689913919b39d7dd0fe77c89610ce2947ab0b43a36895510d7d1f2924d84ab',
        email: 'fake@example.com',
        role: 'ADMIN'
      }
    ]
  }
]

createRecords(seeds, prisma).catch(e => console.error(e))
