const { prisma } = require('./generated/prisma-client')

const companyTypeSeeds = [
  { name: 'admin' }
]

const userRoleSeeds = [
  { name: 'admin' }
]

const passwordPolicySeeds = [
  {
    ruleText: 'Must be at least 6 characters long',
    ruleRegExp: '^\S{6,}$'
  }
]

const networkTypeSeeds = [
  { name: 'LoRa' }
]

const reportingProtocolSeeds = [
  { name: 'POST', protocolHandler: 'postHandler' }
]

const companySeeds = [
  { name: 'SysAdmins', type: 0 }
]

const userSeeds = [
  {
    username: 'admin',
    email: 'admin@fakeco.co',
    company: 0,
    passwordHash: '000000100000003238bd33bdf92cfc3a8e7847e377e51ff8a3689913919b39d7dd0fe77c89610ce2947ab0b43a36895510d7d1f2924d84ab',
    role: 0
  }
]

// Create records, replacing array indexes with IDs
async function main () {
  // no relationships in seeding
  await Promise.all(passwordPolicySeeds.map(x => prisma.createPasswordPolicy(x)))
  await Promise.all(networkTypeSeeds.map(x => prisma.createNetworkType(x)))
  await Promise.all(reportingProtocolSeeds.map(x => prisma.createReportingProtocol(x)))

  // relationships
  const companyTypes = await Promise.all(companyTypeSeeds.map(x => prisma.createCompanyType(x)))
  const userRoles = await Promise.all(userRoleSeeds.map(x => prisma.createUserRole(x)))
  const companies = await Promise.all(companySeeds.map(x => prisma.createCompany({
    ...x,
    type: { connect: { id: companyTypes[x.type] } }
  })))
  await Promise.all(userSeeds.map(x => prisma.createUser({
    ...x,
    company: { connect: { id: companies[x.company] } },
    role: { connect: { id: userRoles[x.role] } }
  })))
}

main().catch(e => console.error(e))
