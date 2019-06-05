const { prisma } = require('../../generated/prisma-client')
const createRecords = require('../../lib/seed-util')

// example
const seeds = [
  {
    type: 'Company',
    plural: 'Companies',
    bodyList: [
      {
        id: 'SYS_ADMINS',
        name: 'SysAdmins',
        type: 'ADMIN'
      }
    ]
  },
  {
    type: 'NetworkType',
    plural: 'NetworkTypes',
    bodyList: [
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
    type: 'ReportingProtocol',
    plural: 'ReportingProtocols',
    bodyList: [
      {
        id: 'POST',
        name: 'POST',
        protocolHandler: 'postHandler'
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
        passwordHash: '000000100000003238bd33bdf92cfc3a8e7847e377e51ff8a3689913919b39d7dd0fe77c89610ce2947ab0b43a36895510d7d1f2924d84ab',
        email: 'fake@example.com',
        company: 'SYS_ADMINS',
        role: 'ADMIN'
      }
    ]
  },
  {
    type: 'PasswordPolicy',
    plural: 'PasswordPolicies',
    bodyList: [
      {
        id: 'PP1',
        ruleText: 'Must be at least 6 characters long',
        ruleRegExp: '^\\S{6,}$',
        company: 'SYS_ADMINS'
      }
    ]
  }
]

createRecords(seeds, prisma).catch(e => console.error(e))
