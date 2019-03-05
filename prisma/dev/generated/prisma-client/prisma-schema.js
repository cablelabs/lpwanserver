module.exports = {
        typeDefs: /* GraphQL */ `type AggregateApplicationNetworkTypeLinks {
  count: Int!
}

type AggregateApplications {
  count: Int!
}

type AggregateCompanies {
  count: Int!
}

type AggregateCompanyNetworkTypeLinks {
  count: Int!
}

type AggregateCompanyTypes {
  count: Int!
}

type AggregateDeviceNetworkTypeLinks {
  count: Int!
}

type AggregateDeviceProfiles {
  count: Int!
}

type AggregateDevices {
  count: Int!
}

type AggregateEmailVerifications {
  count: Int!
}

type AggregateNetworkProtocols {
  count: Int!
}

type AggregateNetworkProviders {
  count: Int!
}

type AggregateNetworks {
  count: Int!
}

type AggregateNetworkTypes {
  count: Int!
}

type AggregatePasswordPolicies {
  count: Int!
}

type AggregateProtocolData {
  count: Int!
}

type AggregateReportingProtocols {
  count: Int!
}

type AggregateUserRoles {
  count: Int!
}

type AggregateUsers {
  count: Int!
}

type ApplicationNetworkTypeLinks {
  application: Applications
  id: Int!
  networkSettings: String
  networkType: NetworkTypes
}

type ApplicationNetworkTypeLinksConnection {
  pageInfo: PageInfo!
  edges: [ApplicationNetworkTypeLinksEdge]!
  aggregate: AggregateApplicationNetworkTypeLinks!
}

input ApplicationNetworkTypeLinksCreateInput {
  application: ApplicationsCreateOneWithoutApplicationNetworkTypeLinksesInput
  networkSettings: String
  networkType: NetworkTypesCreateOneWithoutApplicationNetworkTypeLinksesInput
}

input ApplicationNetworkTypeLinksCreateManyWithoutApplicationInput {
  create: [ApplicationNetworkTypeLinksCreateWithoutApplicationInput!]
  connect: [ApplicationNetworkTypeLinksWhereUniqueInput!]
}

input ApplicationNetworkTypeLinksCreateManyWithoutNetworkTypeInput {
  create: [ApplicationNetworkTypeLinksCreateWithoutNetworkTypeInput!]
  connect: [ApplicationNetworkTypeLinksWhereUniqueInput!]
}

input ApplicationNetworkTypeLinksCreateWithoutApplicationInput {
  networkSettings: String
  networkType: NetworkTypesCreateOneWithoutApplicationNetworkTypeLinksesInput
}

input ApplicationNetworkTypeLinksCreateWithoutNetworkTypeInput {
  application: ApplicationsCreateOneWithoutApplicationNetworkTypeLinksesInput
  networkSettings: String
}

type ApplicationNetworkTypeLinksEdge {
  node: ApplicationNetworkTypeLinks!
  cursor: String!
}

enum ApplicationNetworkTypeLinksOrderByInput {
  id_ASC
  id_DESC
  networkSettings_ASC
  networkSettings_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type ApplicationNetworkTypeLinksPreviousValues {
  id: Int!
  networkSettings: String
}

input ApplicationNetworkTypeLinksScalarWhereInput {
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  networkSettings: String
  networkSettings_not: String
  networkSettings_in: [String!]
  networkSettings_not_in: [String!]
  networkSettings_lt: String
  networkSettings_lte: String
  networkSettings_gt: String
  networkSettings_gte: String
  networkSettings_contains: String
  networkSettings_not_contains: String
  networkSettings_starts_with: String
  networkSettings_not_starts_with: String
  networkSettings_ends_with: String
  networkSettings_not_ends_with: String
  AND: [ApplicationNetworkTypeLinksScalarWhereInput!]
  OR: [ApplicationNetworkTypeLinksScalarWhereInput!]
  NOT: [ApplicationNetworkTypeLinksScalarWhereInput!]
}

type ApplicationNetworkTypeLinksSubscriptionPayload {
  mutation: MutationType!
  node: ApplicationNetworkTypeLinks
  updatedFields: [String!]
  previousValues: ApplicationNetworkTypeLinksPreviousValues
}

input ApplicationNetworkTypeLinksSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: ApplicationNetworkTypeLinksWhereInput
  AND: [ApplicationNetworkTypeLinksSubscriptionWhereInput!]
  OR: [ApplicationNetworkTypeLinksSubscriptionWhereInput!]
  NOT: [ApplicationNetworkTypeLinksSubscriptionWhereInput!]
}

input ApplicationNetworkTypeLinksUpdateInput {
  application: ApplicationsUpdateOneWithoutApplicationNetworkTypeLinksesInput
  networkSettings: String
  networkType: NetworkTypesUpdateOneWithoutApplicationNetworkTypeLinksesInput
}

input ApplicationNetworkTypeLinksUpdateManyDataInput {
  networkSettings: String
}

input ApplicationNetworkTypeLinksUpdateManyMutationInput {
  networkSettings: String
}

input ApplicationNetworkTypeLinksUpdateManyWithoutApplicationInput {
  create: [ApplicationNetworkTypeLinksCreateWithoutApplicationInput!]
  delete: [ApplicationNetworkTypeLinksWhereUniqueInput!]
  connect: [ApplicationNetworkTypeLinksWhereUniqueInput!]
  disconnect: [ApplicationNetworkTypeLinksWhereUniqueInput!]
  update: [ApplicationNetworkTypeLinksUpdateWithWhereUniqueWithoutApplicationInput!]
  upsert: [ApplicationNetworkTypeLinksUpsertWithWhereUniqueWithoutApplicationInput!]
  deleteMany: [ApplicationNetworkTypeLinksScalarWhereInput!]
  updateMany: [ApplicationNetworkTypeLinksUpdateManyWithWhereNestedInput!]
}

input ApplicationNetworkTypeLinksUpdateManyWithoutNetworkTypeInput {
  create: [ApplicationNetworkTypeLinksCreateWithoutNetworkTypeInput!]
  delete: [ApplicationNetworkTypeLinksWhereUniqueInput!]
  connect: [ApplicationNetworkTypeLinksWhereUniqueInput!]
  disconnect: [ApplicationNetworkTypeLinksWhereUniqueInput!]
  update: [ApplicationNetworkTypeLinksUpdateWithWhereUniqueWithoutNetworkTypeInput!]
  upsert: [ApplicationNetworkTypeLinksUpsertWithWhereUniqueWithoutNetworkTypeInput!]
  deleteMany: [ApplicationNetworkTypeLinksScalarWhereInput!]
  updateMany: [ApplicationNetworkTypeLinksUpdateManyWithWhereNestedInput!]
}

input ApplicationNetworkTypeLinksUpdateManyWithWhereNestedInput {
  where: ApplicationNetworkTypeLinksScalarWhereInput!
  data: ApplicationNetworkTypeLinksUpdateManyDataInput!
}

input ApplicationNetworkTypeLinksUpdateWithoutApplicationDataInput {
  networkSettings: String
  networkType: NetworkTypesUpdateOneWithoutApplicationNetworkTypeLinksesInput
}

input ApplicationNetworkTypeLinksUpdateWithoutNetworkTypeDataInput {
  application: ApplicationsUpdateOneWithoutApplicationNetworkTypeLinksesInput
  networkSettings: String
}

input ApplicationNetworkTypeLinksUpdateWithWhereUniqueWithoutApplicationInput {
  where: ApplicationNetworkTypeLinksWhereUniqueInput!
  data: ApplicationNetworkTypeLinksUpdateWithoutApplicationDataInput!
}

input ApplicationNetworkTypeLinksUpdateWithWhereUniqueWithoutNetworkTypeInput {
  where: ApplicationNetworkTypeLinksWhereUniqueInput!
  data: ApplicationNetworkTypeLinksUpdateWithoutNetworkTypeDataInput!
}

input ApplicationNetworkTypeLinksUpsertWithWhereUniqueWithoutApplicationInput {
  where: ApplicationNetworkTypeLinksWhereUniqueInput!
  update: ApplicationNetworkTypeLinksUpdateWithoutApplicationDataInput!
  create: ApplicationNetworkTypeLinksCreateWithoutApplicationInput!
}

input ApplicationNetworkTypeLinksUpsertWithWhereUniqueWithoutNetworkTypeInput {
  where: ApplicationNetworkTypeLinksWhereUniqueInput!
  update: ApplicationNetworkTypeLinksUpdateWithoutNetworkTypeDataInput!
  create: ApplicationNetworkTypeLinksCreateWithoutNetworkTypeInput!
}

input ApplicationNetworkTypeLinksWhereInput {
  application: ApplicationsWhereInput
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  networkSettings: String
  networkSettings_not: String
  networkSettings_in: [String!]
  networkSettings_not_in: [String!]
  networkSettings_lt: String
  networkSettings_lte: String
  networkSettings_gt: String
  networkSettings_gte: String
  networkSettings_contains: String
  networkSettings_not_contains: String
  networkSettings_starts_with: String
  networkSettings_not_starts_with: String
  networkSettings_ends_with: String
  networkSettings_not_ends_with: String
  networkType: NetworkTypesWhereInput
  AND: [ApplicationNetworkTypeLinksWhereInput!]
  OR: [ApplicationNetworkTypeLinksWhereInput!]
  NOT: [ApplicationNetworkTypeLinksWhereInput!]
}

input ApplicationNetworkTypeLinksWhereUniqueInput {
  id: Int
}

type Applications {
  applicationNetworkTypeLinkses(where: ApplicationNetworkTypeLinksWhereInput, orderBy: ApplicationNetworkTypeLinksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [ApplicationNetworkTypeLinks!]
  baseUrl: String
  company: Companies
  description: String
  deviceses(where: DevicesWhereInput, orderBy: DevicesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Devices!]
  id: Int!
  name: String
  reportingProtocol: ReportingProtocols
}

type ApplicationsConnection {
  pageInfo: PageInfo!
  edges: [ApplicationsEdge]!
  aggregate: AggregateApplications!
}

input ApplicationsCreateInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksCreateManyWithoutApplicationInput
  baseUrl: String
  company: CompaniesCreateOneWithoutApplicationsesInput
  description: String
  deviceses: DevicesCreateManyWithoutApplicationInput
  name: String
  reportingProtocol: ReportingProtocolsCreateOneWithoutApplicationsesInput
}

input ApplicationsCreateManyWithoutCompanyInput {
  create: [ApplicationsCreateWithoutCompanyInput!]
  connect: [ApplicationsWhereUniqueInput!]
}

input ApplicationsCreateManyWithoutReportingProtocolInput {
  create: [ApplicationsCreateWithoutReportingProtocolInput!]
  connect: [ApplicationsWhereUniqueInput!]
}

input ApplicationsCreateOneWithoutApplicationNetworkTypeLinksesInput {
  create: ApplicationsCreateWithoutApplicationNetworkTypeLinksesInput
  connect: ApplicationsWhereUniqueInput
}

input ApplicationsCreateOneWithoutDevicesesInput {
  create: ApplicationsCreateWithoutDevicesesInput
  connect: ApplicationsWhereUniqueInput
}

input ApplicationsCreateWithoutApplicationNetworkTypeLinksesInput {
  baseUrl: String
  company: CompaniesCreateOneWithoutApplicationsesInput
  description: String
  deviceses: DevicesCreateManyWithoutApplicationInput
  name: String
  reportingProtocol: ReportingProtocolsCreateOneWithoutApplicationsesInput
}

input ApplicationsCreateWithoutCompanyInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksCreateManyWithoutApplicationInput
  baseUrl: String
  description: String
  deviceses: DevicesCreateManyWithoutApplicationInput
  name: String
  reportingProtocol: ReportingProtocolsCreateOneWithoutApplicationsesInput
}

input ApplicationsCreateWithoutDevicesesInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksCreateManyWithoutApplicationInput
  baseUrl: String
  company: CompaniesCreateOneWithoutApplicationsesInput
  description: String
  name: String
  reportingProtocol: ReportingProtocolsCreateOneWithoutApplicationsesInput
}

input ApplicationsCreateWithoutReportingProtocolInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksCreateManyWithoutApplicationInput
  baseUrl: String
  company: CompaniesCreateOneWithoutApplicationsesInput
  description: String
  deviceses: DevicesCreateManyWithoutApplicationInput
  name: String
}

type ApplicationsEdge {
  node: Applications!
  cursor: String!
}

enum ApplicationsOrderByInput {
  baseUrl_ASC
  baseUrl_DESC
  description_ASC
  description_DESC
  id_ASC
  id_DESC
  name_ASC
  name_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type ApplicationsPreviousValues {
  baseUrl: String
  description: String
  id: Int!
  name: String
}

input ApplicationsScalarWhereInput {
  baseUrl: String
  baseUrl_not: String
  baseUrl_in: [String!]
  baseUrl_not_in: [String!]
  baseUrl_lt: String
  baseUrl_lte: String
  baseUrl_gt: String
  baseUrl_gte: String
  baseUrl_contains: String
  baseUrl_not_contains: String
  baseUrl_starts_with: String
  baseUrl_not_starts_with: String
  baseUrl_ends_with: String
  baseUrl_not_ends_with: String
  description: String
  description_not: String
  description_in: [String!]
  description_not_in: [String!]
  description_lt: String
  description_lte: String
  description_gt: String
  description_gte: String
  description_contains: String
  description_not_contains: String
  description_starts_with: String
  description_not_starts_with: String
  description_ends_with: String
  description_not_ends_with: String
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  AND: [ApplicationsScalarWhereInput!]
  OR: [ApplicationsScalarWhereInput!]
  NOT: [ApplicationsScalarWhereInput!]
}

type ApplicationsSubscriptionPayload {
  mutation: MutationType!
  node: Applications
  updatedFields: [String!]
  previousValues: ApplicationsPreviousValues
}

input ApplicationsSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: ApplicationsWhereInput
  AND: [ApplicationsSubscriptionWhereInput!]
  OR: [ApplicationsSubscriptionWhereInput!]
  NOT: [ApplicationsSubscriptionWhereInput!]
}

input ApplicationsUpdateInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksUpdateManyWithoutApplicationInput
  baseUrl: String
  company: CompaniesUpdateOneWithoutApplicationsesInput
  description: String
  deviceses: DevicesUpdateManyWithoutApplicationInput
  name: String
  reportingProtocol: ReportingProtocolsUpdateOneWithoutApplicationsesInput
}

input ApplicationsUpdateManyDataInput {
  baseUrl: String
  description: String
  name: String
}

input ApplicationsUpdateManyMutationInput {
  baseUrl: String
  description: String
  name: String
}

input ApplicationsUpdateManyWithoutCompanyInput {
  create: [ApplicationsCreateWithoutCompanyInput!]
  delete: [ApplicationsWhereUniqueInput!]
  connect: [ApplicationsWhereUniqueInput!]
  disconnect: [ApplicationsWhereUniqueInput!]
  update: [ApplicationsUpdateWithWhereUniqueWithoutCompanyInput!]
  upsert: [ApplicationsUpsertWithWhereUniqueWithoutCompanyInput!]
  deleteMany: [ApplicationsScalarWhereInput!]
  updateMany: [ApplicationsUpdateManyWithWhereNestedInput!]
}

input ApplicationsUpdateManyWithoutReportingProtocolInput {
  create: [ApplicationsCreateWithoutReportingProtocolInput!]
  delete: [ApplicationsWhereUniqueInput!]
  connect: [ApplicationsWhereUniqueInput!]
  disconnect: [ApplicationsWhereUniqueInput!]
  update: [ApplicationsUpdateWithWhereUniqueWithoutReportingProtocolInput!]
  upsert: [ApplicationsUpsertWithWhereUniqueWithoutReportingProtocolInput!]
  deleteMany: [ApplicationsScalarWhereInput!]
  updateMany: [ApplicationsUpdateManyWithWhereNestedInput!]
}

input ApplicationsUpdateManyWithWhereNestedInput {
  where: ApplicationsScalarWhereInput!
  data: ApplicationsUpdateManyDataInput!
}

input ApplicationsUpdateOneWithoutApplicationNetworkTypeLinksesInput {
  create: ApplicationsCreateWithoutApplicationNetworkTypeLinksesInput
  update: ApplicationsUpdateWithoutApplicationNetworkTypeLinksesDataInput
  upsert: ApplicationsUpsertWithoutApplicationNetworkTypeLinksesInput
  delete: Boolean
  disconnect: Boolean
  connect: ApplicationsWhereUniqueInput
}

input ApplicationsUpdateOneWithoutDevicesesInput {
  create: ApplicationsCreateWithoutDevicesesInput
  update: ApplicationsUpdateWithoutDevicesesDataInput
  upsert: ApplicationsUpsertWithoutDevicesesInput
  delete: Boolean
  disconnect: Boolean
  connect: ApplicationsWhereUniqueInput
}

input ApplicationsUpdateWithoutApplicationNetworkTypeLinksesDataInput {
  baseUrl: String
  company: CompaniesUpdateOneWithoutApplicationsesInput
  description: String
  deviceses: DevicesUpdateManyWithoutApplicationInput
  name: String
  reportingProtocol: ReportingProtocolsUpdateOneWithoutApplicationsesInput
}

input ApplicationsUpdateWithoutCompanyDataInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksUpdateManyWithoutApplicationInput
  baseUrl: String
  description: String
  deviceses: DevicesUpdateManyWithoutApplicationInput
  name: String
  reportingProtocol: ReportingProtocolsUpdateOneWithoutApplicationsesInput
}

input ApplicationsUpdateWithoutDevicesesDataInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksUpdateManyWithoutApplicationInput
  baseUrl: String
  company: CompaniesUpdateOneWithoutApplicationsesInput
  description: String
  name: String
  reportingProtocol: ReportingProtocolsUpdateOneWithoutApplicationsesInput
}

input ApplicationsUpdateWithoutReportingProtocolDataInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksUpdateManyWithoutApplicationInput
  baseUrl: String
  company: CompaniesUpdateOneWithoutApplicationsesInput
  description: String
  deviceses: DevicesUpdateManyWithoutApplicationInput
  name: String
}

input ApplicationsUpdateWithWhereUniqueWithoutCompanyInput {
  where: ApplicationsWhereUniqueInput!
  data: ApplicationsUpdateWithoutCompanyDataInput!
}

input ApplicationsUpdateWithWhereUniqueWithoutReportingProtocolInput {
  where: ApplicationsWhereUniqueInput!
  data: ApplicationsUpdateWithoutReportingProtocolDataInput!
}

input ApplicationsUpsertWithoutApplicationNetworkTypeLinksesInput {
  update: ApplicationsUpdateWithoutApplicationNetworkTypeLinksesDataInput!
  create: ApplicationsCreateWithoutApplicationNetworkTypeLinksesInput!
}

input ApplicationsUpsertWithoutDevicesesInput {
  update: ApplicationsUpdateWithoutDevicesesDataInput!
  create: ApplicationsCreateWithoutDevicesesInput!
}

input ApplicationsUpsertWithWhereUniqueWithoutCompanyInput {
  where: ApplicationsWhereUniqueInput!
  update: ApplicationsUpdateWithoutCompanyDataInput!
  create: ApplicationsCreateWithoutCompanyInput!
}

input ApplicationsUpsertWithWhereUniqueWithoutReportingProtocolInput {
  where: ApplicationsWhereUniqueInput!
  update: ApplicationsUpdateWithoutReportingProtocolDataInput!
  create: ApplicationsCreateWithoutReportingProtocolInput!
}

input ApplicationsWhereInput {
  applicationNetworkTypeLinkses_every: ApplicationNetworkTypeLinksWhereInput
  applicationNetworkTypeLinkses_some: ApplicationNetworkTypeLinksWhereInput
  applicationNetworkTypeLinkses_none: ApplicationNetworkTypeLinksWhereInput
  baseUrl: String
  baseUrl_not: String
  baseUrl_in: [String!]
  baseUrl_not_in: [String!]
  baseUrl_lt: String
  baseUrl_lte: String
  baseUrl_gt: String
  baseUrl_gte: String
  baseUrl_contains: String
  baseUrl_not_contains: String
  baseUrl_starts_with: String
  baseUrl_not_starts_with: String
  baseUrl_ends_with: String
  baseUrl_not_ends_with: String
  company: CompaniesWhereInput
  description: String
  description_not: String
  description_in: [String!]
  description_not_in: [String!]
  description_lt: String
  description_lte: String
  description_gt: String
  description_gte: String
  description_contains: String
  description_not_contains: String
  description_starts_with: String
  description_not_starts_with: String
  description_ends_with: String
  description_not_ends_with: String
  deviceses_every: DevicesWhereInput
  deviceses_some: DevicesWhereInput
  deviceses_none: DevicesWhereInput
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  reportingProtocol: ReportingProtocolsWhereInput
  AND: [ApplicationsWhereInput!]
  OR: [ApplicationsWhereInput!]
  NOT: [ApplicationsWhereInput!]
}

input ApplicationsWhereUniqueInput {
  id: Int
}

type BatchPayload {
  count: Long!
}

type Companies {
  applicationses(where: ApplicationsWhereInput, orderBy: ApplicationsOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Applications!]
  companyNetworkTypeLinkses(where: CompanyNetworkTypeLinksWhereInput, orderBy: CompanyNetworkTypeLinksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [CompanyNetworkTypeLinks!]
  deviceProfileses(where: DeviceProfilesWhereInput, orderBy: DeviceProfilesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [DeviceProfiles!]
  id: Int!
  name: String
  passwordPolicieses(where: PasswordPoliciesWhereInput, orderBy: PasswordPoliciesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [PasswordPolicies!]
  type: CompanyTypes
  userses(where: UsersWhereInput, orderBy: UsersOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Users!]
}

type CompaniesConnection {
  pageInfo: PageInfo!
  edges: [CompaniesEdge]!
  aggregate: AggregateCompanies!
}

input CompaniesCreateInput {
  applicationses: ApplicationsCreateManyWithoutCompanyInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksCreateManyWithoutCompanyInput
  deviceProfileses: DeviceProfilesCreateManyWithoutCompanyInput
  name: String
  passwordPolicieses: PasswordPoliciesCreateManyWithoutCompanyInput
  type: CompanyTypesCreateOneWithoutCompaniesesInput
  userses: UsersCreateManyWithoutCompanyInput
}

input CompaniesCreateManyWithoutTypeInput {
  create: [CompaniesCreateWithoutTypeInput!]
  connect: [CompaniesWhereUniqueInput!]
}

input CompaniesCreateOneWithoutApplicationsesInput {
  create: CompaniesCreateWithoutApplicationsesInput
  connect: CompaniesWhereUniqueInput
}

input CompaniesCreateOneWithoutCompanyNetworkTypeLinksesInput {
  create: CompaniesCreateWithoutCompanyNetworkTypeLinksesInput
  connect: CompaniesWhereUniqueInput
}

input CompaniesCreateOneWithoutDeviceProfilesesInput {
  create: CompaniesCreateWithoutDeviceProfilesesInput
  connect: CompaniesWhereUniqueInput
}

input CompaniesCreateOneWithoutPasswordPoliciesesInput {
  create: CompaniesCreateWithoutPasswordPoliciesesInput
  connect: CompaniesWhereUniqueInput
}

input CompaniesCreateOneWithoutUsersesInput {
  create: CompaniesCreateWithoutUsersesInput
  connect: CompaniesWhereUniqueInput
}

input CompaniesCreateWithoutApplicationsesInput {
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksCreateManyWithoutCompanyInput
  deviceProfileses: DeviceProfilesCreateManyWithoutCompanyInput
  name: String
  passwordPolicieses: PasswordPoliciesCreateManyWithoutCompanyInput
  type: CompanyTypesCreateOneWithoutCompaniesesInput
  userses: UsersCreateManyWithoutCompanyInput
}

input CompaniesCreateWithoutCompanyNetworkTypeLinksesInput {
  applicationses: ApplicationsCreateManyWithoutCompanyInput
  deviceProfileses: DeviceProfilesCreateManyWithoutCompanyInput
  name: String
  passwordPolicieses: PasswordPoliciesCreateManyWithoutCompanyInput
  type: CompanyTypesCreateOneWithoutCompaniesesInput
  userses: UsersCreateManyWithoutCompanyInput
}

input CompaniesCreateWithoutDeviceProfilesesInput {
  applicationses: ApplicationsCreateManyWithoutCompanyInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksCreateManyWithoutCompanyInput
  name: String
  passwordPolicieses: PasswordPoliciesCreateManyWithoutCompanyInput
  type: CompanyTypesCreateOneWithoutCompaniesesInput
  userses: UsersCreateManyWithoutCompanyInput
}

input CompaniesCreateWithoutPasswordPoliciesesInput {
  applicationses: ApplicationsCreateManyWithoutCompanyInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksCreateManyWithoutCompanyInput
  deviceProfileses: DeviceProfilesCreateManyWithoutCompanyInput
  name: String
  type: CompanyTypesCreateOneWithoutCompaniesesInput
  userses: UsersCreateManyWithoutCompanyInput
}

input CompaniesCreateWithoutTypeInput {
  applicationses: ApplicationsCreateManyWithoutCompanyInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksCreateManyWithoutCompanyInput
  deviceProfileses: DeviceProfilesCreateManyWithoutCompanyInput
  name: String
  passwordPolicieses: PasswordPoliciesCreateManyWithoutCompanyInput
  userses: UsersCreateManyWithoutCompanyInput
}

input CompaniesCreateWithoutUsersesInput {
  applicationses: ApplicationsCreateManyWithoutCompanyInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksCreateManyWithoutCompanyInput
  deviceProfileses: DeviceProfilesCreateManyWithoutCompanyInput
  name: String
  passwordPolicieses: PasswordPoliciesCreateManyWithoutCompanyInput
  type: CompanyTypesCreateOneWithoutCompaniesesInput
}

type CompaniesEdge {
  node: Companies!
  cursor: String!
}

enum CompaniesOrderByInput {
  id_ASC
  id_DESC
  name_ASC
  name_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type CompaniesPreviousValues {
  id: Int!
  name: String
}

input CompaniesScalarWhereInput {
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  AND: [CompaniesScalarWhereInput!]
  OR: [CompaniesScalarWhereInput!]
  NOT: [CompaniesScalarWhereInput!]
}

type CompaniesSubscriptionPayload {
  mutation: MutationType!
  node: Companies
  updatedFields: [String!]
  previousValues: CompaniesPreviousValues
}

input CompaniesSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: CompaniesWhereInput
  AND: [CompaniesSubscriptionWhereInput!]
  OR: [CompaniesSubscriptionWhereInput!]
  NOT: [CompaniesSubscriptionWhereInput!]
}

input CompaniesUpdateInput {
  applicationses: ApplicationsUpdateManyWithoutCompanyInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksUpdateManyWithoutCompanyInput
  deviceProfileses: DeviceProfilesUpdateManyWithoutCompanyInput
  name: String
  passwordPolicieses: PasswordPoliciesUpdateManyWithoutCompanyInput
  type: CompanyTypesUpdateOneWithoutCompaniesesInput
  userses: UsersUpdateManyWithoutCompanyInput
}

input CompaniesUpdateManyDataInput {
  name: String
}

input CompaniesUpdateManyMutationInput {
  name: String
}

input CompaniesUpdateManyWithoutTypeInput {
  create: [CompaniesCreateWithoutTypeInput!]
  delete: [CompaniesWhereUniqueInput!]
  connect: [CompaniesWhereUniqueInput!]
  disconnect: [CompaniesWhereUniqueInput!]
  update: [CompaniesUpdateWithWhereUniqueWithoutTypeInput!]
  upsert: [CompaniesUpsertWithWhereUniqueWithoutTypeInput!]
  deleteMany: [CompaniesScalarWhereInput!]
  updateMany: [CompaniesUpdateManyWithWhereNestedInput!]
}

input CompaniesUpdateManyWithWhereNestedInput {
  where: CompaniesScalarWhereInput!
  data: CompaniesUpdateManyDataInput!
}

input CompaniesUpdateOneWithoutApplicationsesInput {
  create: CompaniesCreateWithoutApplicationsesInput
  update: CompaniesUpdateWithoutApplicationsesDataInput
  upsert: CompaniesUpsertWithoutApplicationsesInput
  delete: Boolean
  disconnect: Boolean
  connect: CompaniesWhereUniqueInput
}

input CompaniesUpdateOneWithoutCompanyNetworkTypeLinksesInput {
  create: CompaniesCreateWithoutCompanyNetworkTypeLinksesInput
  update: CompaniesUpdateWithoutCompanyNetworkTypeLinksesDataInput
  upsert: CompaniesUpsertWithoutCompanyNetworkTypeLinksesInput
  delete: Boolean
  disconnect: Boolean
  connect: CompaniesWhereUniqueInput
}

input CompaniesUpdateOneWithoutDeviceProfilesesInput {
  create: CompaniesCreateWithoutDeviceProfilesesInput
  update: CompaniesUpdateWithoutDeviceProfilesesDataInput
  upsert: CompaniesUpsertWithoutDeviceProfilesesInput
  delete: Boolean
  disconnect: Boolean
  connect: CompaniesWhereUniqueInput
}

input CompaniesUpdateOneWithoutPasswordPoliciesesInput {
  create: CompaniesCreateWithoutPasswordPoliciesesInput
  update: CompaniesUpdateWithoutPasswordPoliciesesDataInput
  upsert: CompaniesUpsertWithoutPasswordPoliciesesInput
  delete: Boolean
  disconnect: Boolean
  connect: CompaniesWhereUniqueInput
}

input CompaniesUpdateOneWithoutUsersesInput {
  create: CompaniesCreateWithoutUsersesInput
  update: CompaniesUpdateWithoutUsersesDataInput
  upsert: CompaniesUpsertWithoutUsersesInput
  delete: Boolean
  disconnect: Boolean
  connect: CompaniesWhereUniqueInput
}

input CompaniesUpdateWithoutApplicationsesDataInput {
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksUpdateManyWithoutCompanyInput
  deviceProfileses: DeviceProfilesUpdateManyWithoutCompanyInput
  name: String
  passwordPolicieses: PasswordPoliciesUpdateManyWithoutCompanyInput
  type: CompanyTypesUpdateOneWithoutCompaniesesInput
  userses: UsersUpdateManyWithoutCompanyInput
}

input CompaniesUpdateWithoutCompanyNetworkTypeLinksesDataInput {
  applicationses: ApplicationsUpdateManyWithoutCompanyInput
  deviceProfileses: DeviceProfilesUpdateManyWithoutCompanyInput
  name: String
  passwordPolicieses: PasswordPoliciesUpdateManyWithoutCompanyInput
  type: CompanyTypesUpdateOneWithoutCompaniesesInput
  userses: UsersUpdateManyWithoutCompanyInput
}

input CompaniesUpdateWithoutDeviceProfilesesDataInput {
  applicationses: ApplicationsUpdateManyWithoutCompanyInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksUpdateManyWithoutCompanyInput
  name: String
  passwordPolicieses: PasswordPoliciesUpdateManyWithoutCompanyInput
  type: CompanyTypesUpdateOneWithoutCompaniesesInput
  userses: UsersUpdateManyWithoutCompanyInput
}

input CompaniesUpdateWithoutPasswordPoliciesesDataInput {
  applicationses: ApplicationsUpdateManyWithoutCompanyInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksUpdateManyWithoutCompanyInput
  deviceProfileses: DeviceProfilesUpdateManyWithoutCompanyInput
  name: String
  type: CompanyTypesUpdateOneWithoutCompaniesesInput
  userses: UsersUpdateManyWithoutCompanyInput
}

input CompaniesUpdateWithoutTypeDataInput {
  applicationses: ApplicationsUpdateManyWithoutCompanyInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksUpdateManyWithoutCompanyInput
  deviceProfileses: DeviceProfilesUpdateManyWithoutCompanyInput
  name: String
  passwordPolicieses: PasswordPoliciesUpdateManyWithoutCompanyInput
  userses: UsersUpdateManyWithoutCompanyInput
}

input CompaniesUpdateWithoutUsersesDataInput {
  applicationses: ApplicationsUpdateManyWithoutCompanyInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksUpdateManyWithoutCompanyInput
  deviceProfileses: DeviceProfilesUpdateManyWithoutCompanyInput
  name: String
  passwordPolicieses: PasswordPoliciesUpdateManyWithoutCompanyInput
  type: CompanyTypesUpdateOneWithoutCompaniesesInput
}

input CompaniesUpdateWithWhereUniqueWithoutTypeInput {
  where: CompaniesWhereUniqueInput!
  data: CompaniesUpdateWithoutTypeDataInput!
}

input CompaniesUpsertWithoutApplicationsesInput {
  update: CompaniesUpdateWithoutApplicationsesDataInput!
  create: CompaniesCreateWithoutApplicationsesInput!
}

input CompaniesUpsertWithoutCompanyNetworkTypeLinksesInput {
  update: CompaniesUpdateWithoutCompanyNetworkTypeLinksesDataInput!
  create: CompaniesCreateWithoutCompanyNetworkTypeLinksesInput!
}

input CompaniesUpsertWithoutDeviceProfilesesInput {
  update: CompaniesUpdateWithoutDeviceProfilesesDataInput!
  create: CompaniesCreateWithoutDeviceProfilesesInput!
}

input CompaniesUpsertWithoutPasswordPoliciesesInput {
  update: CompaniesUpdateWithoutPasswordPoliciesesDataInput!
  create: CompaniesCreateWithoutPasswordPoliciesesInput!
}

input CompaniesUpsertWithoutUsersesInput {
  update: CompaniesUpdateWithoutUsersesDataInput!
  create: CompaniesCreateWithoutUsersesInput!
}

input CompaniesUpsertWithWhereUniqueWithoutTypeInput {
  where: CompaniesWhereUniqueInput!
  update: CompaniesUpdateWithoutTypeDataInput!
  create: CompaniesCreateWithoutTypeInput!
}

input CompaniesWhereInput {
  applicationses_every: ApplicationsWhereInput
  applicationses_some: ApplicationsWhereInput
  applicationses_none: ApplicationsWhereInput
  companyNetworkTypeLinkses_every: CompanyNetworkTypeLinksWhereInput
  companyNetworkTypeLinkses_some: CompanyNetworkTypeLinksWhereInput
  companyNetworkTypeLinkses_none: CompanyNetworkTypeLinksWhereInput
  deviceProfileses_every: DeviceProfilesWhereInput
  deviceProfileses_some: DeviceProfilesWhereInput
  deviceProfileses_none: DeviceProfilesWhereInput
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  passwordPolicieses_every: PasswordPoliciesWhereInput
  passwordPolicieses_some: PasswordPoliciesWhereInput
  passwordPolicieses_none: PasswordPoliciesWhereInput
  type: CompanyTypesWhereInput
  userses_every: UsersWhereInput
  userses_some: UsersWhereInput
  userses_none: UsersWhereInput
  AND: [CompaniesWhereInput!]
  OR: [CompaniesWhereInput!]
  NOT: [CompaniesWhereInput!]
}

input CompaniesWhereUniqueInput {
  id: Int
}

type CompanyNetworkTypeLinks {
  company: Companies
  id: Int!
  networkSettings: String
  networkType: NetworkTypes
}

type CompanyNetworkTypeLinksConnection {
  pageInfo: PageInfo!
  edges: [CompanyNetworkTypeLinksEdge]!
  aggregate: AggregateCompanyNetworkTypeLinks!
}

input CompanyNetworkTypeLinksCreateInput {
  company: CompaniesCreateOneWithoutCompanyNetworkTypeLinksesInput
  networkSettings: String
  networkType: NetworkTypesCreateOneWithoutCompanyNetworkTypeLinksesInput
}

input CompanyNetworkTypeLinksCreateManyWithoutCompanyInput {
  create: [CompanyNetworkTypeLinksCreateWithoutCompanyInput!]
  connect: [CompanyNetworkTypeLinksWhereUniqueInput!]
}

input CompanyNetworkTypeLinksCreateManyWithoutNetworkTypeInput {
  create: [CompanyNetworkTypeLinksCreateWithoutNetworkTypeInput!]
  connect: [CompanyNetworkTypeLinksWhereUniqueInput!]
}

input CompanyNetworkTypeLinksCreateWithoutCompanyInput {
  networkSettings: String
  networkType: NetworkTypesCreateOneWithoutCompanyNetworkTypeLinksesInput
}

input CompanyNetworkTypeLinksCreateWithoutNetworkTypeInput {
  company: CompaniesCreateOneWithoutCompanyNetworkTypeLinksesInput
  networkSettings: String
}

type CompanyNetworkTypeLinksEdge {
  node: CompanyNetworkTypeLinks!
  cursor: String!
}

enum CompanyNetworkTypeLinksOrderByInput {
  id_ASC
  id_DESC
  networkSettings_ASC
  networkSettings_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type CompanyNetworkTypeLinksPreviousValues {
  id: Int!
  networkSettings: String
}

input CompanyNetworkTypeLinksScalarWhereInput {
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  networkSettings: String
  networkSettings_not: String
  networkSettings_in: [String!]
  networkSettings_not_in: [String!]
  networkSettings_lt: String
  networkSettings_lte: String
  networkSettings_gt: String
  networkSettings_gte: String
  networkSettings_contains: String
  networkSettings_not_contains: String
  networkSettings_starts_with: String
  networkSettings_not_starts_with: String
  networkSettings_ends_with: String
  networkSettings_not_ends_with: String
  AND: [CompanyNetworkTypeLinksScalarWhereInput!]
  OR: [CompanyNetworkTypeLinksScalarWhereInput!]
  NOT: [CompanyNetworkTypeLinksScalarWhereInput!]
}

type CompanyNetworkTypeLinksSubscriptionPayload {
  mutation: MutationType!
  node: CompanyNetworkTypeLinks
  updatedFields: [String!]
  previousValues: CompanyNetworkTypeLinksPreviousValues
}

input CompanyNetworkTypeLinksSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: CompanyNetworkTypeLinksWhereInput
  AND: [CompanyNetworkTypeLinksSubscriptionWhereInput!]
  OR: [CompanyNetworkTypeLinksSubscriptionWhereInput!]
  NOT: [CompanyNetworkTypeLinksSubscriptionWhereInput!]
}

input CompanyNetworkTypeLinksUpdateInput {
  company: CompaniesUpdateOneWithoutCompanyNetworkTypeLinksesInput
  networkSettings: String
  networkType: NetworkTypesUpdateOneWithoutCompanyNetworkTypeLinksesInput
}

input CompanyNetworkTypeLinksUpdateManyDataInput {
  networkSettings: String
}

input CompanyNetworkTypeLinksUpdateManyMutationInput {
  networkSettings: String
}

input CompanyNetworkTypeLinksUpdateManyWithoutCompanyInput {
  create: [CompanyNetworkTypeLinksCreateWithoutCompanyInput!]
  delete: [CompanyNetworkTypeLinksWhereUniqueInput!]
  connect: [CompanyNetworkTypeLinksWhereUniqueInput!]
  disconnect: [CompanyNetworkTypeLinksWhereUniqueInput!]
  update: [CompanyNetworkTypeLinksUpdateWithWhereUniqueWithoutCompanyInput!]
  upsert: [CompanyNetworkTypeLinksUpsertWithWhereUniqueWithoutCompanyInput!]
  deleteMany: [CompanyNetworkTypeLinksScalarWhereInput!]
  updateMany: [CompanyNetworkTypeLinksUpdateManyWithWhereNestedInput!]
}

input CompanyNetworkTypeLinksUpdateManyWithoutNetworkTypeInput {
  create: [CompanyNetworkTypeLinksCreateWithoutNetworkTypeInput!]
  delete: [CompanyNetworkTypeLinksWhereUniqueInput!]
  connect: [CompanyNetworkTypeLinksWhereUniqueInput!]
  disconnect: [CompanyNetworkTypeLinksWhereUniqueInput!]
  update: [CompanyNetworkTypeLinksUpdateWithWhereUniqueWithoutNetworkTypeInput!]
  upsert: [CompanyNetworkTypeLinksUpsertWithWhereUniqueWithoutNetworkTypeInput!]
  deleteMany: [CompanyNetworkTypeLinksScalarWhereInput!]
  updateMany: [CompanyNetworkTypeLinksUpdateManyWithWhereNestedInput!]
}

input CompanyNetworkTypeLinksUpdateManyWithWhereNestedInput {
  where: CompanyNetworkTypeLinksScalarWhereInput!
  data: CompanyNetworkTypeLinksUpdateManyDataInput!
}

input CompanyNetworkTypeLinksUpdateWithoutCompanyDataInput {
  networkSettings: String
  networkType: NetworkTypesUpdateOneWithoutCompanyNetworkTypeLinksesInput
}

input CompanyNetworkTypeLinksUpdateWithoutNetworkTypeDataInput {
  company: CompaniesUpdateOneWithoutCompanyNetworkTypeLinksesInput
  networkSettings: String
}

input CompanyNetworkTypeLinksUpdateWithWhereUniqueWithoutCompanyInput {
  where: CompanyNetworkTypeLinksWhereUniqueInput!
  data: CompanyNetworkTypeLinksUpdateWithoutCompanyDataInput!
}

input CompanyNetworkTypeLinksUpdateWithWhereUniqueWithoutNetworkTypeInput {
  where: CompanyNetworkTypeLinksWhereUniqueInput!
  data: CompanyNetworkTypeLinksUpdateWithoutNetworkTypeDataInput!
}

input CompanyNetworkTypeLinksUpsertWithWhereUniqueWithoutCompanyInput {
  where: CompanyNetworkTypeLinksWhereUniqueInput!
  update: CompanyNetworkTypeLinksUpdateWithoutCompanyDataInput!
  create: CompanyNetworkTypeLinksCreateWithoutCompanyInput!
}

input CompanyNetworkTypeLinksUpsertWithWhereUniqueWithoutNetworkTypeInput {
  where: CompanyNetworkTypeLinksWhereUniqueInput!
  update: CompanyNetworkTypeLinksUpdateWithoutNetworkTypeDataInput!
  create: CompanyNetworkTypeLinksCreateWithoutNetworkTypeInput!
}

input CompanyNetworkTypeLinksWhereInput {
  company: CompaniesWhereInput
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  networkSettings: String
  networkSettings_not: String
  networkSettings_in: [String!]
  networkSettings_not_in: [String!]
  networkSettings_lt: String
  networkSettings_lte: String
  networkSettings_gt: String
  networkSettings_gte: String
  networkSettings_contains: String
  networkSettings_not_contains: String
  networkSettings_starts_with: String
  networkSettings_not_starts_with: String
  networkSettings_ends_with: String
  networkSettings_not_ends_with: String
  networkType: NetworkTypesWhereInput
  AND: [CompanyNetworkTypeLinksWhereInput!]
  OR: [CompanyNetworkTypeLinksWhereInput!]
  NOT: [CompanyNetworkTypeLinksWhereInput!]
}

input CompanyNetworkTypeLinksWhereUniqueInput {
  id: Int
}

type CompanyTypes {
  companieses(where: CompaniesWhereInput, orderBy: CompaniesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Companies!]
  id: Int!
  name: String
}

type CompanyTypesConnection {
  pageInfo: PageInfo!
  edges: [CompanyTypesEdge]!
  aggregate: AggregateCompanyTypes!
}

input CompanyTypesCreateInput {
  companieses: CompaniesCreateManyWithoutTypeInput
  name: String
}

input CompanyTypesCreateOneWithoutCompaniesesInput {
  create: CompanyTypesCreateWithoutCompaniesesInput
  connect: CompanyTypesWhereUniqueInput
}

input CompanyTypesCreateWithoutCompaniesesInput {
  name: String
}

type CompanyTypesEdge {
  node: CompanyTypes!
  cursor: String!
}

enum CompanyTypesOrderByInput {
  id_ASC
  id_DESC
  name_ASC
  name_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type CompanyTypesPreviousValues {
  id: Int!
  name: String
}

type CompanyTypesSubscriptionPayload {
  mutation: MutationType!
  node: CompanyTypes
  updatedFields: [String!]
  previousValues: CompanyTypesPreviousValues
}

input CompanyTypesSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: CompanyTypesWhereInput
  AND: [CompanyTypesSubscriptionWhereInput!]
  OR: [CompanyTypesSubscriptionWhereInput!]
  NOT: [CompanyTypesSubscriptionWhereInput!]
}

input CompanyTypesUpdateInput {
  companieses: CompaniesUpdateManyWithoutTypeInput
  name: String
}

input CompanyTypesUpdateManyMutationInput {
  name: String
}

input CompanyTypesUpdateOneWithoutCompaniesesInput {
  create: CompanyTypesCreateWithoutCompaniesesInput
  update: CompanyTypesUpdateWithoutCompaniesesDataInput
  upsert: CompanyTypesUpsertWithoutCompaniesesInput
  delete: Boolean
  disconnect: Boolean
  connect: CompanyTypesWhereUniqueInput
}

input CompanyTypesUpdateWithoutCompaniesesDataInput {
  name: String
}

input CompanyTypesUpsertWithoutCompaniesesInput {
  update: CompanyTypesUpdateWithoutCompaniesesDataInput!
  create: CompanyTypesCreateWithoutCompaniesesInput!
}

input CompanyTypesWhereInput {
  companieses_every: CompaniesWhereInput
  companieses_some: CompaniesWhereInput
  companieses_none: CompaniesWhereInput
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  AND: [CompanyTypesWhereInput!]
  OR: [CompanyTypesWhereInput!]
  NOT: [CompanyTypesWhereInput!]
}

input CompanyTypesWhereUniqueInput {
  id: Int
}

type DeviceNetworkTypeLinks {
  device: Devices
  deviceProfile: DeviceProfiles
  id: Int!
  networkSettings: String
  networkType: NetworkTypes
}

type DeviceNetworkTypeLinksConnection {
  pageInfo: PageInfo!
  edges: [DeviceNetworkTypeLinksEdge]!
  aggregate: AggregateDeviceNetworkTypeLinks!
}

input DeviceNetworkTypeLinksCreateInput {
  device: DevicesCreateOneWithoutDeviceNetworkTypeLinksesInput
  deviceProfile: DeviceProfilesCreateOneWithoutDeviceNetworkTypeLinksesInput
  networkSettings: String
  networkType: NetworkTypesCreateOneWithoutDeviceNetworkTypeLinksesInput
}

input DeviceNetworkTypeLinksCreateManyWithoutDeviceInput {
  create: [DeviceNetworkTypeLinksCreateWithoutDeviceInput!]
  connect: [DeviceNetworkTypeLinksWhereUniqueInput!]
}

input DeviceNetworkTypeLinksCreateManyWithoutDeviceProfileInput {
  create: [DeviceNetworkTypeLinksCreateWithoutDeviceProfileInput!]
  connect: [DeviceNetworkTypeLinksWhereUniqueInput!]
}

input DeviceNetworkTypeLinksCreateManyWithoutNetworkTypeInput {
  create: [DeviceNetworkTypeLinksCreateWithoutNetworkTypeInput!]
  connect: [DeviceNetworkTypeLinksWhereUniqueInput!]
}

input DeviceNetworkTypeLinksCreateWithoutDeviceInput {
  deviceProfile: DeviceProfilesCreateOneWithoutDeviceNetworkTypeLinksesInput
  networkSettings: String
  networkType: NetworkTypesCreateOneWithoutDeviceNetworkTypeLinksesInput
}

input DeviceNetworkTypeLinksCreateWithoutDeviceProfileInput {
  device: DevicesCreateOneWithoutDeviceNetworkTypeLinksesInput
  networkSettings: String
  networkType: NetworkTypesCreateOneWithoutDeviceNetworkTypeLinksesInput
}

input DeviceNetworkTypeLinksCreateWithoutNetworkTypeInput {
  device: DevicesCreateOneWithoutDeviceNetworkTypeLinksesInput
  deviceProfile: DeviceProfilesCreateOneWithoutDeviceNetworkTypeLinksesInput
  networkSettings: String
}

type DeviceNetworkTypeLinksEdge {
  node: DeviceNetworkTypeLinks!
  cursor: String!
}

enum DeviceNetworkTypeLinksOrderByInput {
  id_ASC
  id_DESC
  networkSettings_ASC
  networkSettings_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type DeviceNetworkTypeLinksPreviousValues {
  id: Int!
  networkSettings: String
}

input DeviceNetworkTypeLinksScalarWhereInput {
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  networkSettings: String
  networkSettings_not: String
  networkSettings_in: [String!]
  networkSettings_not_in: [String!]
  networkSettings_lt: String
  networkSettings_lte: String
  networkSettings_gt: String
  networkSettings_gte: String
  networkSettings_contains: String
  networkSettings_not_contains: String
  networkSettings_starts_with: String
  networkSettings_not_starts_with: String
  networkSettings_ends_with: String
  networkSettings_not_ends_with: String
  AND: [DeviceNetworkTypeLinksScalarWhereInput!]
  OR: [DeviceNetworkTypeLinksScalarWhereInput!]
  NOT: [DeviceNetworkTypeLinksScalarWhereInput!]
}

type DeviceNetworkTypeLinksSubscriptionPayload {
  mutation: MutationType!
  node: DeviceNetworkTypeLinks
  updatedFields: [String!]
  previousValues: DeviceNetworkTypeLinksPreviousValues
}

input DeviceNetworkTypeLinksSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: DeviceNetworkTypeLinksWhereInput
  AND: [DeviceNetworkTypeLinksSubscriptionWhereInput!]
  OR: [DeviceNetworkTypeLinksSubscriptionWhereInput!]
  NOT: [DeviceNetworkTypeLinksSubscriptionWhereInput!]
}

input DeviceNetworkTypeLinksUpdateInput {
  device: DevicesUpdateOneWithoutDeviceNetworkTypeLinksesInput
  deviceProfile: DeviceProfilesUpdateOneWithoutDeviceNetworkTypeLinksesInput
  networkSettings: String
  networkType: NetworkTypesUpdateOneWithoutDeviceNetworkTypeLinksesInput
}

input DeviceNetworkTypeLinksUpdateManyDataInput {
  networkSettings: String
}

input DeviceNetworkTypeLinksUpdateManyMutationInput {
  networkSettings: String
}

input DeviceNetworkTypeLinksUpdateManyWithoutDeviceInput {
  create: [DeviceNetworkTypeLinksCreateWithoutDeviceInput!]
  delete: [DeviceNetworkTypeLinksWhereUniqueInput!]
  connect: [DeviceNetworkTypeLinksWhereUniqueInput!]
  disconnect: [DeviceNetworkTypeLinksWhereUniqueInput!]
  update: [DeviceNetworkTypeLinksUpdateWithWhereUniqueWithoutDeviceInput!]
  upsert: [DeviceNetworkTypeLinksUpsertWithWhereUniqueWithoutDeviceInput!]
  deleteMany: [DeviceNetworkTypeLinksScalarWhereInput!]
  updateMany: [DeviceNetworkTypeLinksUpdateManyWithWhereNestedInput!]
}

input DeviceNetworkTypeLinksUpdateManyWithoutDeviceProfileInput {
  create: [DeviceNetworkTypeLinksCreateWithoutDeviceProfileInput!]
  delete: [DeviceNetworkTypeLinksWhereUniqueInput!]
  connect: [DeviceNetworkTypeLinksWhereUniqueInput!]
  disconnect: [DeviceNetworkTypeLinksWhereUniqueInput!]
  update: [DeviceNetworkTypeLinksUpdateWithWhereUniqueWithoutDeviceProfileInput!]
  upsert: [DeviceNetworkTypeLinksUpsertWithWhereUniqueWithoutDeviceProfileInput!]
  deleteMany: [DeviceNetworkTypeLinksScalarWhereInput!]
  updateMany: [DeviceNetworkTypeLinksUpdateManyWithWhereNestedInput!]
}

input DeviceNetworkTypeLinksUpdateManyWithoutNetworkTypeInput {
  create: [DeviceNetworkTypeLinksCreateWithoutNetworkTypeInput!]
  delete: [DeviceNetworkTypeLinksWhereUniqueInput!]
  connect: [DeviceNetworkTypeLinksWhereUniqueInput!]
  disconnect: [DeviceNetworkTypeLinksWhereUniqueInput!]
  update: [DeviceNetworkTypeLinksUpdateWithWhereUniqueWithoutNetworkTypeInput!]
  upsert: [DeviceNetworkTypeLinksUpsertWithWhereUniqueWithoutNetworkTypeInput!]
  deleteMany: [DeviceNetworkTypeLinksScalarWhereInput!]
  updateMany: [DeviceNetworkTypeLinksUpdateManyWithWhereNestedInput!]
}

input DeviceNetworkTypeLinksUpdateManyWithWhereNestedInput {
  where: DeviceNetworkTypeLinksScalarWhereInput!
  data: DeviceNetworkTypeLinksUpdateManyDataInput!
}

input DeviceNetworkTypeLinksUpdateWithoutDeviceDataInput {
  deviceProfile: DeviceProfilesUpdateOneWithoutDeviceNetworkTypeLinksesInput
  networkSettings: String
  networkType: NetworkTypesUpdateOneWithoutDeviceNetworkTypeLinksesInput
}

input DeviceNetworkTypeLinksUpdateWithoutDeviceProfileDataInput {
  device: DevicesUpdateOneWithoutDeviceNetworkTypeLinksesInput
  networkSettings: String
  networkType: NetworkTypesUpdateOneWithoutDeviceNetworkTypeLinksesInput
}

input DeviceNetworkTypeLinksUpdateWithoutNetworkTypeDataInput {
  device: DevicesUpdateOneWithoutDeviceNetworkTypeLinksesInput
  deviceProfile: DeviceProfilesUpdateOneWithoutDeviceNetworkTypeLinksesInput
  networkSettings: String
}

input DeviceNetworkTypeLinksUpdateWithWhereUniqueWithoutDeviceInput {
  where: DeviceNetworkTypeLinksWhereUniqueInput!
  data: DeviceNetworkTypeLinksUpdateWithoutDeviceDataInput!
}

input DeviceNetworkTypeLinksUpdateWithWhereUniqueWithoutDeviceProfileInput {
  where: DeviceNetworkTypeLinksWhereUniqueInput!
  data: DeviceNetworkTypeLinksUpdateWithoutDeviceProfileDataInput!
}

input DeviceNetworkTypeLinksUpdateWithWhereUniqueWithoutNetworkTypeInput {
  where: DeviceNetworkTypeLinksWhereUniqueInput!
  data: DeviceNetworkTypeLinksUpdateWithoutNetworkTypeDataInput!
}

input DeviceNetworkTypeLinksUpsertWithWhereUniqueWithoutDeviceInput {
  where: DeviceNetworkTypeLinksWhereUniqueInput!
  update: DeviceNetworkTypeLinksUpdateWithoutDeviceDataInput!
  create: DeviceNetworkTypeLinksCreateWithoutDeviceInput!
}

input DeviceNetworkTypeLinksUpsertWithWhereUniqueWithoutDeviceProfileInput {
  where: DeviceNetworkTypeLinksWhereUniqueInput!
  update: DeviceNetworkTypeLinksUpdateWithoutDeviceProfileDataInput!
  create: DeviceNetworkTypeLinksCreateWithoutDeviceProfileInput!
}

input DeviceNetworkTypeLinksUpsertWithWhereUniqueWithoutNetworkTypeInput {
  where: DeviceNetworkTypeLinksWhereUniqueInput!
  update: DeviceNetworkTypeLinksUpdateWithoutNetworkTypeDataInput!
  create: DeviceNetworkTypeLinksCreateWithoutNetworkTypeInput!
}

input DeviceNetworkTypeLinksWhereInput {
  device: DevicesWhereInput
  deviceProfile: DeviceProfilesWhereInput
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  networkSettings: String
  networkSettings_not: String
  networkSettings_in: [String!]
  networkSettings_not_in: [String!]
  networkSettings_lt: String
  networkSettings_lte: String
  networkSettings_gt: String
  networkSettings_gte: String
  networkSettings_contains: String
  networkSettings_not_contains: String
  networkSettings_starts_with: String
  networkSettings_not_starts_with: String
  networkSettings_ends_with: String
  networkSettings_not_ends_with: String
  networkType: NetworkTypesWhereInput
  AND: [DeviceNetworkTypeLinksWhereInput!]
  OR: [DeviceNetworkTypeLinksWhereInput!]
  NOT: [DeviceNetworkTypeLinksWhereInput!]
}

input DeviceNetworkTypeLinksWhereUniqueInput {
  id: Int
}

type DeviceProfiles {
  company: Companies
  description: String
  deviceNetworkTypeLinkses(where: DeviceNetworkTypeLinksWhereInput, orderBy: DeviceNetworkTypeLinksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [DeviceNetworkTypeLinks!]
  id: Int!
  name: String
  networkSettings: String
  networkType: NetworkTypes
}

type DeviceProfilesConnection {
  pageInfo: PageInfo!
  edges: [DeviceProfilesEdge]!
  aggregate: AggregateDeviceProfiles!
}

input DeviceProfilesCreateInput {
  company: CompaniesCreateOneWithoutDeviceProfilesesInput
  description: String
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksCreateManyWithoutDeviceProfileInput
  name: String
  networkSettings: String
  networkType: NetworkTypesCreateOneWithoutDeviceProfilesesInput
}

input DeviceProfilesCreateManyWithoutCompanyInput {
  create: [DeviceProfilesCreateWithoutCompanyInput!]
  connect: [DeviceProfilesWhereUniqueInput!]
}

input DeviceProfilesCreateManyWithoutNetworkTypeInput {
  create: [DeviceProfilesCreateWithoutNetworkTypeInput!]
  connect: [DeviceProfilesWhereUniqueInput!]
}

input DeviceProfilesCreateOneWithoutDeviceNetworkTypeLinksesInput {
  create: DeviceProfilesCreateWithoutDeviceNetworkTypeLinksesInput
  connect: DeviceProfilesWhereUniqueInput
}

input DeviceProfilesCreateWithoutCompanyInput {
  description: String
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksCreateManyWithoutDeviceProfileInput
  name: String
  networkSettings: String
  networkType: NetworkTypesCreateOneWithoutDeviceProfilesesInput
}

input DeviceProfilesCreateWithoutDeviceNetworkTypeLinksesInput {
  company: CompaniesCreateOneWithoutDeviceProfilesesInput
  description: String
  name: String
  networkSettings: String
  networkType: NetworkTypesCreateOneWithoutDeviceProfilesesInput
}

input DeviceProfilesCreateWithoutNetworkTypeInput {
  company: CompaniesCreateOneWithoutDeviceProfilesesInput
  description: String
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksCreateManyWithoutDeviceProfileInput
  name: String
  networkSettings: String
}

type DeviceProfilesEdge {
  node: DeviceProfiles!
  cursor: String!
}

enum DeviceProfilesOrderByInput {
  description_ASC
  description_DESC
  id_ASC
  id_DESC
  name_ASC
  name_DESC
  networkSettings_ASC
  networkSettings_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type DeviceProfilesPreviousValues {
  description: String
  id: Int!
  name: String
  networkSettings: String
}

input DeviceProfilesScalarWhereInput {
  description: String
  description_not: String
  description_in: [String!]
  description_not_in: [String!]
  description_lt: String
  description_lte: String
  description_gt: String
  description_gte: String
  description_contains: String
  description_not_contains: String
  description_starts_with: String
  description_not_starts_with: String
  description_ends_with: String
  description_not_ends_with: String
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  networkSettings: String
  networkSettings_not: String
  networkSettings_in: [String!]
  networkSettings_not_in: [String!]
  networkSettings_lt: String
  networkSettings_lte: String
  networkSettings_gt: String
  networkSettings_gte: String
  networkSettings_contains: String
  networkSettings_not_contains: String
  networkSettings_starts_with: String
  networkSettings_not_starts_with: String
  networkSettings_ends_with: String
  networkSettings_not_ends_with: String
  AND: [DeviceProfilesScalarWhereInput!]
  OR: [DeviceProfilesScalarWhereInput!]
  NOT: [DeviceProfilesScalarWhereInput!]
}

type DeviceProfilesSubscriptionPayload {
  mutation: MutationType!
  node: DeviceProfiles
  updatedFields: [String!]
  previousValues: DeviceProfilesPreviousValues
}

input DeviceProfilesSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: DeviceProfilesWhereInput
  AND: [DeviceProfilesSubscriptionWhereInput!]
  OR: [DeviceProfilesSubscriptionWhereInput!]
  NOT: [DeviceProfilesSubscriptionWhereInput!]
}

input DeviceProfilesUpdateInput {
  company: CompaniesUpdateOneWithoutDeviceProfilesesInput
  description: String
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksUpdateManyWithoutDeviceProfileInput
  name: String
  networkSettings: String
  networkType: NetworkTypesUpdateOneWithoutDeviceProfilesesInput
}

input DeviceProfilesUpdateManyDataInput {
  description: String
  name: String
  networkSettings: String
}

input DeviceProfilesUpdateManyMutationInput {
  description: String
  name: String
  networkSettings: String
}

input DeviceProfilesUpdateManyWithoutCompanyInput {
  create: [DeviceProfilesCreateWithoutCompanyInput!]
  delete: [DeviceProfilesWhereUniqueInput!]
  connect: [DeviceProfilesWhereUniqueInput!]
  disconnect: [DeviceProfilesWhereUniqueInput!]
  update: [DeviceProfilesUpdateWithWhereUniqueWithoutCompanyInput!]
  upsert: [DeviceProfilesUpsertWithWhereUniqueWithoutCompanyInput!]
  deleteMany: [DeviceProfilesScalarWhereInput!]
  updateMany: [DeviceProfilesUpdateManyWithWhereNestedInput!]
}

input DeviceProfilesUpdateManyWithoutNetworkTypeInput {
  create: [DeviceProfilesCreateWithoutNetworkTypeInput!]
  delete: [DeviceProfilesWhereUniqueInput!]
  connect: [DeviceProfilesWhereUniqueInput!]
  disconnect: [DeviceProfilesWhereUniqueInput!]
  update: [DeviceProfilesUpdateWithWhereUniqueWithoutNetworkTypeInput!]
  upsert: [DeviceProfilesUpsertWithWhereUniqueWithoutNetworkTypeInput!]
  deleteMany: [DeviceProfilesScalarWhereInput!]
  updateMany: [DeviceProfilesUpdateManyWithWhereNestedInput!]
}

input DeviceProfilesUpdateManyWithWhereNestedInput {
  where: DeviceProfilesScalarWhereInput!
  data: DeviceProfilesUpdateManyDataInput!
}

input DeviceProfilesUpdateOneWithoutDeviceNetworkTypeLinksesInput {
  create: DeviceProfilesCreateWithoutDeviceNetworkTypeLinksesInput
  update: DeviceProfilesUpdateWithoutDeviceNetworkTypeLinksesDataInput
  upsert: DeviceProfilesUpsertWithoutDeviceNetworkTypeLinksesInput
  delete: Boolean
  disconnect: Boolean
  connect: DeviceProfilesWhereUniqueInput
}

input DeviceProfilesUpdateWithoutCompanyDataInput {
  description: String
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksUpdateManyWithoutDeviceProfileInput
  name: String
  networkSettings: String
  networkType: NetworkTypesUpdateOneWithoutDeviceProfilesesInput
}

input DeviceProfilesUpdateWithoutDeviceNetworkTypeLinksesDataInput {
  company: CompaniesUpdateOneWithoutDeviceProfilesesInput
  description: String
  name: String
  networkSettings: String
  networkType: NetworkTypesUpdateOneWithoutDeviceProfilesesInput
}

input DeviceProfilesUpdateWithoutNetworkTypeDataInput {
  company: CompaniesUpdateOneWithoutDeviceProfilesesInput
  description: String
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksUpdateManyWithoutDeviceProfileInput
  name: String
  networkSettings: String
}

input DeviceProfilesUpdateWithWhereUniqueWithoutCompanyInput {
  where: DeviceProfilesWhereUniqueInput!
  data: DeviceProfilesUpdateWithoutCompanyDataInput!
}

input DeviceProfilesUpdateWithWhereUniqueWithoutNetworkTypeInput {
  where: DeviceProfilesWhereUniqueInput!
  data: DeviceProfilesUpdateWithoutNetworkTypeDataInput!
}

input DeviceProfilesUpsertWithoutDeviceNetworkTypeLinksesInput {
  update: DeviceProfilesUpdateWithoutDeviceNetworkTypeLinksesDataInput!
  create: DeviceProfilesCreateWithoutDeviceNetworkTypeLinksesInput!
}

input DeviceProfilesUpsertWithWhereUniqueWithoutCompanyInput {
  where: DeviceProfilesWhereUniqueInput!
  update: DeviceProfilesUpdateWithoutCompanyDataInput!
  create: DeviceProfilesCreateWithoutCompanyInput!
}

input DeviceProfilesUpsertWithWhereUniqueWithoutNetworkTypeInput {
  where: DeviceProfilesWhereUniqueInput!
  update: DeviceProfilesUpdateWithoutNetworkTypeDataInput!
  create: DeviceProfilesCreateWithoutNetworkTypeInput!
}

input DeviceProfilesWhereInput {
  company: CompaniesWhereInput
  description: String
  description_not: String
  description_in: [String!]
  description_not_in: [String!]
  description_lt: String
  description_lte: String
  description_gt: String
  description_gte: String
  description_contains: String
  description_not_contains: String
  description_starts_with: String
  description_not_starts_with: String
  description_ends_with: String
  description_not_ends_with: String
  deviceNetworkTypeLinkses_every: DeviceNetworkTypeLinksWhereInput
  deviceNetworkTypeLinkses_some: DeviceNetworkTypeLinksWhereInput
  deviceNetworkTypeLinkses_none: DeviceNetworkTypeLinksWhereInput
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  networkSettings: String
  networkSettings_not: String
  networkSettings_in: [String!]
  networkSettings_not_in: [String!]
  networkSettings_lt: String
  networkSettings_lte: String
  networkSettings_gt: String
  networkSettings_gte: String
  networkSettings_contains: String
  networkSettings_not_contains: String
  networkSettings_starts_with: String
  networkSettings_not_starts_with: String
  networkSettings_ends_with: String
  networkSettings_not_ends_with: String
  networkType: NetworkTypesWhereInput
  AND: [DeviceProfilesWhereInput!]
  OR: [DeviceProfilesWhereInput!]
  NOT: [DeviceProfilesWhereInput!]
}

input DeviceProfilesWhereUniqueInput {
  id: Int
}

type Devices {
  application: Applications
  description: String
  deviceModel: String
  deviceNetworkTypeLinkses(where: DeviceNetworkTypeLinksWhereInput, orderBy: DeviceNetworkTypeLinksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [DeviceNetworkTypeLinks!]
  id: Int!
  name: String
}

type DevicesConnection {
  pageInfo: PageInfo!
  edges: [DevicesEdge]!
  aggregate: AggregateDevices!
}

input DevicesCreateInput {
  application: ApplicationsCreateOneWithoutDevicesesInput
  description: String
  deviceModel: String
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksCreateManyWithoutDeviceInput
  name: String
}

input DevicesCreateManyWithoutApplicationInput {
  create: [DevicesCreateWithoutApplicationInput!]
  connect: [DevicesWhereUniqueInput!]
}

input DevicesCreateOneWithoutDeviceNetworkTypeLinksesInput {
  create: DevicesCreateWithoutDeviceNetworkTypeLinksesInput
  connect: DevicesWhereUniqueInput
}

input DevicesCreateWithoutApplicationInput {
  description: String
  deviceModel: String
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksCreateManyWithoutDeviceInput
  name: String
}

input DevicesCreateWithoutDeviceNetworkTypeLinksesInput {
  application: ApplicationsCreateOneWithoutDevicesesInput
  description: String
  deviceModel: String
  name: String
}

type DevicesEdge {
  node: Devices!
  cursor: String!
}

enum DevicesOrderByInput {
  description_ASC
  description_DESC
  deviceModel_ASC
  deviceModel_DESC
  id_ASC
  id_DESC
  name_ASC
  name_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type DevicesPreviousValues {
  description: String
  deviceModel: String
  id: Int!
  name: String
}

input DevicesScalarWhereInput {
  description: String
  description_not: String
  description_in: [String!]
  description_not_in: [String!]
  description_lt: String
  description_lte: String
  description_gt: String
  description_gte: String
  description_contains: String
  description_not_contains: String
  description_starts_with: String
  description_not_starts_with: String
  description_ends_with: String
  description_not_ends_with: String
  deviceModel: String
  deviceModel_not: String
  deviceModel_in: [String!]
  deviceModel_not_in: [String!]
  deviceModel_lt: String
  deviceModel_lte: String
  deviceModel_gt: String
  deviceModel_gte: String
  deviceModel_contains: String
  deviceModel_not_contains: String
  deviceModel_starts_with: String
  deviceModel_not_starts_with: String
  deviceModel_ends_with: String
  deviceModel_not_ends_with: String
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  AND: [DevicesScalarWhereInput!]
  OR: [DevicesScalarWhereInput!]
  NOT: [DevicesScalarWhereInput!]
}

type DevicesSubscriptionPayload {
  mutation: MutationType!
  node: Devices
  updatedFields: [String!]
  previousValues: DevicesPreviousValues
}

input DevicesSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: DevicesWhereInput
  AND: [DevicesSubscriptionWhereInput!]
  OR: [DevicesSubscriptionWhereInput!]
  NOT: [DevicesSubscriptionWhereInput!]
}

input DevicesUpdateInput {
  application: ApplicationsUpdateOneWithoutDevicesesInput
  description: String
  deviceModel: String
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksUpdateManyWithoutDeviceInput
  name: String
}

input DevicesUpdateManyDataInput {
  description: String
  deviceModel: String
  name: String
}

input DevicesUpdateManyMutationInput {
  description: String
  deviceModel: String
  name: String
}

input DevicesUpdateManyWithoutApplicationInput {
  create: [DevicesCreateWithoutApplicationInput!]
  delete: [DevicesWhereUniqueInput!]
  connect: [DevicesWhereUniqueInput!]
  disconnect: [DevicesWhereUniqueInput!]
  update: [DevicesUpdateWithWhereUniqueWithoutApplicationInput!]
  upsert: [DevicesUpsertWithWhereUniqueWithoutApplicationInput!]
  deleteMany: [DevicesScalarWhereInput!]
  updateMany: [DevicesUpdateManyWithWhereNestedInput!]
}

input DevicesUpdateManyWithWhereNestedInput {
  where: DevicesScalarWhereInput!
  data: DevicesUpdateManyDataInput!
}

input DevicesUpdateOneWithoutDeviceNetworkTypeLinksesInput {
  create: DevicesCreateWithoutDeviceNetworkTypeLinksesInput
  update: DevicesUpdateWithoutDeviceNetworkTypeLinksesDataInput
  upsert: DevicesUpsertWithoutDeviceNetworkTypeLinksesInput
  delete: Boolean
  disconnect: Boolean
  connect: DevicesWhereUniqueInput
}

input DevicesUpdateWithoutApplicationDataInput {
  description: String
  deviceModel: String
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksUpdateManyWithoutDeviceInput
  name: String
}

input DevicesUpdateWithoutDeviceNetworkTypeLinksesDataInput {
  application: ApplicationsUpdateOneWithoutDevicesesInput
  description: String
  deviceModel: String
  name: String
}

input DevicesUpdateWithWhereUniqueWithoutApplicationInput {
  where: DevicesWhereUniqueInput!
  data: DevicesUpdateWithoutApplicationDataInput!
}

input DevicesUpsertWithoutDeviceNetworkTypeLinksesInput {
  update: DevicesUpdateWithoutDeviceNetworkTypeLinksesDataInput!
  create: DevicesCreateWithoutDeviceNetworkTypeLinksesInput!
}

input DevicesUpsertWithWhereUniqueWithoutApplicationInput {
  where: DevicesWhereUniqueInput!
  update: DevicesUpdateWithoutApplicationDataInput!
  create: DevicesCreateWithoutApplicationInput!
}

input DevicesWhereInput {
  application: ApplicationsWhereInput
  description: String
  description_not: String
  description_in: [String!]
  description_not_in: [String!]
  description_lt: String
  description_lte: String
  description_gt: String
  description_gte: String
  description_contains: String
  description_not_contains: String
  description_starts_with: String
  description_not_starts_with: String
  description_ends_with: String
  description_not_ends_with: String
  deviceModel: String
  deviceModel_not: String
  deviceModel_in: [String!]
  deviceModel_not_in: [String!]
  deviceModel_lt: String
  deviceModel_lte: String
  deviceModel_gt: String
  deviceModel_gte: String
  deviceModel_contains: String
  deviceModel_not_contains: String
  deviceModel_starts_with: String
  deviceModel_not_starts_with: String
  deviceModel_ends_with: String
  deviceModel_not_ends_with: String
  deviceNetworkTypeLinkses_every: DeviceNetworkTypeLinksWhereInput
  deviceNetworkTypeLinkses_some: DeviceNetworkTypeLinksWhereInput
  deviceNetworkTypeLinkses_none: DeviceNetworkTypeLinksWhereInput
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  AND: [DevicesWhereInput!]
  OR: [DevicesWhereInput!]
  NOT: [DevicesWhereInput!]
}

input DevicesWhereUniqueInput {
  id: Int
}

type EmailVerifications {
  changeRequested: String
  email: String
  id: Int!
  user: Users
  uuid: String
}

type EmailVerificationsConnection {
  pageInfo: PageInfo!
  edges: [EmailVerificationsEdge]!
  aggregate: AggregateEmailVerifications!
}

input EmailVerificationsCreateInput {
  changeRequested: String
  email: String
  user: UsersCreateOneWithoutEmailVerificationsesInput
  uuid: String
}

input EmailVerificationsCreateManyWithoutUserInput {
  create: [EmailVerificationsCreateWithoutUserInput!]
  connect: [EmailVerificationsWhereUniqueInput!]
}

input EmailVerificationsCreateWithoutUserInput {
  changeRequested: String
  email: String
  uuid: String
}

type EmailVerificationsEdge {
  node: EmailVerifications!
  cursor: String!
}

enum EmailVerificationsOrderByInput {
  changeRequested_ASC
  changeRequested_DESC
  email_ASC
  email_DESC
  id_ASC
  id_DESC
  uuid_ASC
  uuid_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type EmailVerificationsPreviousValues {
  changeRequested: String
  email: String
  id: Int!
  uuid: String
}

input EmailVerificationsScalarWhereInput {
  changeRequested: String
  changeRequested_not: String
  changeRequested_in: [String!]
  changeRequested_not_in: [String!]
  changeRequested_lt: String
  changeRequested_lte: String
  changeRequested_gt: String
  changeRequested_gte: String
  changeRequested_contains: String
  changeRequested_not_contains: String
  changeRequested_starts_with: String
  changeRequested_not_starts_with: String
  changeRequested_ends_with: String
  changeRequested_not_ends_with: String
  email: String
  email_not: String
  email_in: [String!]
  email_not_in: [String!]
  email_lt: String
  email_lte: String
  email_gt: String
  email_gte: String
  email_contains: String
  email_not_contains: String
  email_starts_with: String
  email_not_starts_with: String
  email_ends_with: String
  email_not_ends_with: String
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  uuid: String
  uuid_not: String
  uuid_in: [String!]
  uuid_not_in: [String!]
  uuid_lt: String
  uuid_lte: String
  uuid_gt: String
  uuid_gte: String
  uuid_contains: String
  uuid_not_contains: String
  uuid_starts_with: String
  uuid_not_starts_with: String
  uuid_ends_with: String
  uuid_not_ends_with: String
  AND: [EmailVerificationsScalarWhereInput!]
  OR: [EmailVerificationsScalarWhereInput!]
  NOT: [EmailVerificationsScalarWhereInput!]
}

type EmailVerificationsSubscriptionPayload {
  mutation: MutationType!
  node: EmailVerifications
  updatedFields: [String!]
  previousValues: EmailVerificationsPreviousValues
}

input EmailVerificationsSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: EmailVerificationsWhereInput
  AND: [EmailVerificationsSubscriptionWhereInput!]
  OR: [EmailVerificationsSubscriptionWhereInput!]
  NOT: [EmailVerificationsSubscriptionWhereInput!]
}

input EmailVerificationsUpdateInput {
  changeRequested: String
  email: String
  user: UsersUpdateOneWithoutEmailVerificationsesInput
  uuid: String
}

input EmailVerificationsUpdateManyDataInput {
  changeRequested: String
  email: String
  uuid: String
}

input EmailVerificationsUpdateManyMutationInput {
  changeRequested: String
  email: String
  uuid: String
}

input EmailVerificationsUpdateManyWithoutUserInput {
  create: [EmailVerificationsCreateWithoutUserInput!]
  delete: [EmailVerificationsWhereUniqueInput!]
  connect: [EmailVerificationsWhereUniqueInput!]
  disconnect: [EmailVerificationsWhereUniqueInput!]
  update: [EmailVerificationsUpdateWithWhereUniqueWithoutUserInput!]
  upsert: [EmailVerificationsUpsertWithWhereUniqueWithoutUserInput!]
  deleteMany: [EmailVerificationsScalarWhereInput!]
  updateMany: [EmailVerificationsUpdateManyWithWhereNestedInput!]
}

input EmailVerificationsUpdateManyWithWhereNestedInput {
  where: EmailVerificationsScalarWhereInput!
  data: EmailVerificationsUpdateManyDataInput!
}

input EmailVerificationsUpdateWithoutUserDataInput {
  changeRequested: String
  email: String
  uuid: String
}

input EmailVerificationsUpdateWithWhereUniqueWithoutUserInput {
  where: EmailVerificationsWhereUniqueInput!
  data: EmailVerificationsUpdateWithoutUserDataInput!
}

input EmailVerificationsUpsertWithWhereUniqueWithoutUserInput {
  where: EmailVerificationsWhereUniqueInput!
  update: EmailVerificationsUpdateWithoutUserDataInput!
  create: EmailVerificationsCreateWithoutUserInput!
}

input EmailVerificationsWhereInput {
  changeRequested: String
  changeRequested_not: String
  changeRequested_in: [String!]
  changeRequested_not_in: [String!]
  changeRequested_lt: String
  changeRequested_lte: String
  changeRequested_gt: String
  changeRequested_gte: String
  changeRequested_contains: String
  changeRequested_not_contains: String
  changeRequested_starts_with: String
  changeRequested_not_starts_with: String
  changeRequested_ends_with: String
  changeRequested_not_ends_with: String
  email: String
  email_not: String
  email_in: [String!]
  email_not_in: [String!]
  email_lt: String
  email_lte: String
  email_gt: String
  email_gte: String
  email_contains: String
  email_not_contains: String
  email_starts_with: String
  email_not_starts_with: String
  email_ends_with: String
  email_not_ends_with: String
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  user: UsersWhereInput
  uuid: String
  uuid_not: String
  uuid_in: [String!]
  uuid_not_in: [String!]
  uuid_lt: String
  uuid_lte: String
  uuid_gt: String
  uuid_gte: String
  uuid_contains: String
  uuid_not_contains: String
  uuid_starts_with: String
  uuid_not_starts_with: String
  uuid_ends_with: String
  uuid_not_ends_with: String
  AND: [EmailVerificationsWhereInput!]
  OR: [EmailVerificationsWhereInput!]
  NOT: [EmailVerificationsWhereInput!]
}

input EmailVerificationsWhereUniqueInput {
  id: Int
}

scalar Long

type Mutation {
  createApplicationNetworkTypeLinks(data: ApplicationNetworkTypeLinksCreateInput!): ApplicationNetworkTypeLinks!
  updateApplicationNetworkTypeLinks(data: ApplicationNetworkTypeLinksUpdateInput!, where: ApplicationNetworkTypeLinksWhereUniqueInput!): ApplicationNetworkTypeLinks
  updateManyApplicationNetworkTypeLinkses(data: ApplicationNetworkTypeLinksUpdateManyMutationInput!, where: ApplicationNetworkTypeLinksWhereInput): BatchPayload!
  upsertApplicationNetworkTypeLinks(where: ApplicationNetworkTypeLinksWhereUniqueInput!, create: ApplicationNetworkTypeLinksCreateInput!, update: ApplicationNetworkTypeLinksUpdateInput!): ApplicationNetworkTypeLinks!
  deleteApplicationNetworkTypeLinks(where: ApplicationNetworkTypeLinksWhereUniqueInput!): ApplicationNetworkTypeLinks
  deleteManyApplicationNetworkTypeLinkses(where: ApplicationNetworkTypeLinksWhereInput): BatchPayload!
  createApplications(data: ApplicationsCreateInput!): Applications!
  updateApplications(data: ApplicationsUpdateInput!, where: ApplicationsWhereUniqueInput!): Applications
  updateManyApplicationses(data: ApplicationsUpdateManyMutationInput!, where: ApplicationsWhereInput): BatchPayload!
  upsertApplications(where: ApplicationsWhereUniqueInput!, create: ApplicationsCreateInput!, update: ApplicationsUpdateInput!): Applications!
  deleteApplications(where: ApplicationsWhereUniqueInput!): Applications
  deleteManyApplicationses(where: ApplicationsWhereInput): BatchPayload!
  createCompanies(data: CompaniesCreateInput!): Companies!
  updateCompanies(data: CompaniesUpdateInput!, where: CompaniesWhereUniqueInput!): Companies
  updateManyCompanieses(data: CompaniesUpdateManyMutationInput!, where: CompaniesWhereInput): BatchPayload!
  upsertCompanies(where: CompaniesWhereUniqueInput!, create: CompaniesCreateInput!, update: CompaniesUpdateInput!): Companies!
  deleteCompanies(where: CompaniesWhereUniqueInput!): Companies
  deleteManyCompanieses(where: CompaniesWhereInput): BatchPayload!
  createCompanyNetworkTypeLinks(data: CompanyNetworkTypeLinksCreateInput!): CompanyNetworkTypeLinks!
  updateCompanyNetworkTypeLinks(data: CompanyNetworkTypeLinksUpdateInput!, where: CompanyNetworkTypeLinksWhereUniqueInput!): CompanyNetworkTypeLinks
  updateManyCompanyNetworkTypeLinkses(data: CompanyNetworkTypeLinksUpdateManyMutationInput!, where: CompanyNetworkTypeLinksWhereInput): BatchPayload!
  upsertCompanyNetworkTypeLinks(where: CompanyNetworkTypeLinksWhereUniqueInput!, create: CompanyNetworkTypeLinksCreateInput!, update: CompanyNetworkTypeLinksUpdateInput!): CompanyNetworkTypeLinks!
  deleteCompanyNetworkTypeLinks(where: CompanyNetworkTypeLinksWhereUniqueInput!): CompanyNetworkTypeLinks
  deleteManyCompanyNetworkTypeLinkses(where: CompanyNetworkTypeLinksWhereInput): BatchPayload!
  createCompanyTypes(data: CompanyTypesCreateInput!): CompanyTypes!
  updateCompanyTypes(data: CompanyTypesUpdateInput!, where: CompanyTypesWhereUniqueInput!): CompanyTypes
  updateManyCompanyTypeses(data: CompanyTypesUpdateManyMutationInput!, where: CompanyTypesWhereInput): BatchPayload!
  upsertCompanyTypes(where: CompanyTypesWhereUniqueInput!, create: CompanyTypesCreateInput!, update: CompanyTypesUpdateInput!): CompanyTypes!
  deleteCompanyTypes(where: CompanyTypesWhereUniqueInput!): CompanyTypes
  deleteManyCompanyTypeses(where: CompanyTypesWhereInput): BatchPayload!
  createDeviceNetworkTypeLinks(data: DeviceNetworkTypeLinksCreateInput!): DeviceNetworkTypeLinks!
  updateDeviceNetworkTypeLinks(data: DeviceNetworkTypeLinksUpdateInput!, where: DeviceNetworkTypeLinksWhereUniqueInput!): DeviceNetworkTypeLinks
  updateManyDeviceNetworkTypeLinkses(data: DeviceNetworkTypeLinksUpdateManyMutationInput!, where: DeviceNetworkTypeLinksWhereInput): BatchPayload!
  upsertDeviceNetworkTypeLinks(where: DeviceNetworkTypeLinksWhereUniqueInput!, create: DeviceNetworkTypeLinksCreateInput!, update: DeviceNetworkTypeLinksUpdateInput!): DeviceNetworkTypeLinks!
  deleteDeviceNetworkTypeLinks(where: DeviceNetworkTypeLinksWhereUniqueInput!): DeviceNetworkTypeLinks
  deleteManyDeviceNetworkTypeLinkses(where: DeviceNetworkTypeLinksWhereInput): BatchPayload!
  createDeviceProfiles(data: DeviceProfilesCreateInput!): DeviceProfiles!
  updateDeviceProfiles(data: DeviceProfilesUpdateInput!, where: DeviceProfilesWhereUniqueInput!): DeviceProfiles
  updateManyDeviceProfileses(data: DeviceProfilesUpdateManyMutationInput!, where: DeviceProfilesWhereInput): BatchPayload!
  upsertDeviceProfiles(where: DeviceProfilesWhereUniqueInput!, create: DeviceProfilesCreateInput!, update: DeviceProfilesUpdateInput!): DeviceProfiles!
  deleteDeviceProfiles(where: DeviceProfilesWhereUniqueInput!): DeviceProfiles
  deleteManyDeviceProfileses(where: DeviceProfilesWhereInput): BatchPayload!
  createDevices(data: DevicesCreateInput!): Devices!
  updateDevices(data: DevicesUpdateInput!, where: DevicesWhereUniqueInput!): Devices
  updateManyDeviceses(data: DevicesUpdateManyMutationInput!, where: DevicesWhereInput): BatchPayload!
  upsertDevices(where: DevicesWhereUniqueInput!, create: DevicesCreateInput!, update: DevicesUpdateInput!): Devices!
  deleteDevices(where: DevicesWhereUniqueInput!): Devices
  deleteManyDeviceses(where: DevicesWhereInput): BatchPayload!
  createEmailVerifications(data: EmailVerificationsCreateInput!): EmailVerifications!
  updateEmailVerifications(data: EmailVerificationsUpdateInput!, where: EmailVerificationsWhereUniqueInput!): EmailVerifications
  updateManyEmailVerificationses(data: EmailVerificationsUpdateManyMutationInput!, where: EmailVerificationsWhereInput): BatchPayload!
  upsertEmailVerifications(where: EmailVerificationsWhereUniqueInput!, create: EmailVerificationsCreateInput!, update: EmailVerificationsUpdateInput!): EmailVerifications!
  deleteEmailVerifications(where: EmailVerificationsWhereUniqueInput!): EmailVerifications
  deleteManyEmailVerificationses(where: EmailVerificationsWhereInput): BatchPayload!
  createNetworkProtocols(data: NetworkProtocolsCreateInput!): NetworkProtocols!
  updateNetworkProtocols(data: NetworkProtocolsUpdateInput!, where: NetworkProtocolsWhereUniqueInput!): NetworkProtocols
  updateManyNetworkProtocolses(data: NetworkProtocolsUpdateManyMutationInput!, where: NetworkProtocolsWhereInput): BatchPayload!
  upsertNetworkProtocols(where: NetworkProtocolsWhereUniqueInput!, create: NetworkProtocolsCreateInput!, update: NetworkProtocolsUpdateInput!): NetworkProtocols!
  deleteNetworkProtocols(where: NetworkProtocolsWhereUniqueInput!): NetworkProtocols
  deleteManyNetworkProtocolses(where: NetworkProtocolsWhereInput): BatchPayload!
  createNetworkProviders(data: NetworkProvidersCreateInput!): NetworkProviders!
  updateNetworkProviders(data: NetworkProvidersUpdateInput!, where: NetworkProvidersWhereUniqueInput!): NetworkProviders
  updateManyNetworkProviderses(data: NetworkProvidersUpdateManyMutationInput!, where: NetworkProvidersWhereInput): BatchPayload!
  upsertNetworkProviders(where: NetworkProvidersWhereUniqueInput!, create: NetworkProvidersCreateInput!, update: NetworkProvidersUpdateInput!): NetworkProviders!
  deleteNetworkProviders(where: NetworkProvidersWhereUniqueInput!): NetworkProviders
  deleteManyNetworkProviderses(where: NetworkProvidersWhereInput): BatchPayload!
  createNetworkTypes(data: NetworkTypesCreateInput!): NetworkTypes!
  updateNetworkTypes(data: NetworkTypesUpdateInput!, where: NetworkTypesWhereUniqueInput!): NetworkTypes
  updateManyNetworkTypeses(data: NetworkTypesUpdateManyMutationInput!, where: NetworkTypesWhereInput): BatchPayload!
  upsertNetworkTypes(where: NetworkTypesWhereUniqueInput!, create: NetworkTypesCreateInput!, update: NetworkTypesUpdateInput!): NetworkTypes!
  deleteNetworkTypes(where: NetworkTypesWhereUniqueInput!): NetworkTypes
  deleteManyNetworkTypeses(where: NetworkTypesWhereInput): BatchPayload!
  createNetworks(data: NetworksCreateInput!): Networks!
  updateNetworks(data: NetworksUpdateInput!, where: NetworksWhereUniqueInput!): Networks
  updateManyNetworkses(data: NetworksUpdateManyMutationInput!, where: NetworksWhereInput): BatchPayload!
  upsertNetworks(where: NetworksWhereUniqueInput!, create: NetworksCreateInput!, update: NetworksUpdateInput!): Networks!
  deleteNetworks(where: NetworksWhereUniqueInput!): Networks
  deleteManyNetworkses(where: NetworksWhereInput): BatchPayload!
  createPasswordPolicies(data: PasswordPoliciesCreateInput!): PasswordPolicies!
  updatePasswordPolicies(data: PasswordPoliciesUpdateInput!, where: PasswordPoliciesWhereUniqueInput!): PasswordPolicies
  updateManyPasswordPolicieses(data: PasswordPoliciesUpdateManyMutationInput!, where: PasswordPoliciesWhereInput): BatchPayload!
  upsertPasswordPolicies(where: PasswordPoliciesWhereUniqueInput!, create: PasswordPoliciesCreateInput!, update: PasswordPoliciesUpdateInput!): PasswordPolicies!
  deletePasswordPolicies(where: PasswordPoliciesWhereUniqueInput!): PasswordPolicies
  deleteManyPasswordPolicieses(where: PasswordPoliciesWhereInput): BatchPayload!
  createProtocolData(data: ProtocolDataCreateInput!): ProtocolData!
  updateProtocolData(data: ProtocolDataUpdateInput!, where: ProtocolDataWhereUniqueInput!): ProtocolData
  updateManyProtocolDatas(data: ProtocolDataUpdateManyMutationInput!, where: ProtocolDataWhereInput): BatchPayload!
  upsertProtocolData(where: ProtocolDataWhereUniqueInput!, create: ProtocolDataCreateInput!, update: ProtocolDataUpdateInput!): ProtocolData!
  deleteProtocolData(where: ProtocolDataWhereUniqueInput!): ProtocolData
  deleteManyProtocolDatas(where: ProtocolDataWhereInput): BatchPayload!
  createReportingProtocols(data: ReportingProtocolsCreateInput!): ReportingProtocols!
  updateReportingProtocols(data: ReportingProtocolsUpdateInput!, where: ReportingProtocolsWhereUniqueInput!): ReportingProtocols
  updateManyReportingProtocolses(data: ReportingProtocolsUpdateManyMutationInput!, where: ReportingProtocolsWhereInput): BatchPayload!
  upsertReportingProtocols(where: ReportingProtocolsWhereUniqueInput!, create: ReportingProtocolsCreateInput!, update: ReportingProtocolsUpdateInput!): ReportingProtocols!
  deleteReportingProtocols(where: ReportingProtocolsWhereUniqueInput!): ReportingProtocols
  deleteManyReportingProtocolses(where: ReportingProtocolsWhereInput): BatchPayload!
  createUserRoles(data: UserRolesCreateInput!): UserRoles!
  updateUserRoles(data: UserRolesUpdateInput!, where: UserRolesWhereUniqueInput!): UserRoles
  updateManyUserRoleses(data: UserRolesUpdateManyMutationInput!, where: UserRolesWhereInput): BatchPayload!
  upsertUserRoles(where: UserRolesWhereUniqueInput!, create: UserRolesCreateInput!, update: UserRolesUpdateInput!): UserRoles!
  deleteUserRoles(where: UserRolesWhereUniqueInput!): UserRoles
  deleteManyUserRoleses(where: UserRolesWhereInput): BatchPayload!
  createUsers(data: UsersCreateInput!): Users!
  updateUsers(data: UsersUpdateInput!, where: UsersWhereUniqueInput!): Users
  updateManyUserses(data: UsersUpdateManyMutationInput!, where: UsersWhereInput): BatchPayload!
  upsertUsers(where: UsersWhereUniqueInput!, create: UsersCreateInput!, update: UsersUpdateInput!): Users!
  deleteUsers(where: UsersWhereUniqueInput!): Users
  deleteManyUserses(where: UsersWhereInput): BatchPayload!
}

enum MutationType {
  CREATED
  UPDATED
  DELETED
}

type NetworkProtocols {
  id: Int!
  masterProtocol: NetworkProtocols
  name: String
  networkProtocolses(where: NetworkProtocolsWhereInput, orderBy: NetworkProtocolsOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [NetworkProtocols!]
  networkProtocolVersion: String
  networkses(where: NetworksWhereInput, orderBy: NetworksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Networks!]
  networkType: NetworkTypes
  protocolDatas(where: ProtocolDataWhereInput, orderBy: ProtocolDataOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [ProtocolData!]
  protocolHandler: String
}

type NetworkProtocolsConnection {
  pageInfo: PageInfo!
  edges: [NetworkProtocolsEdge]!
  aggregate: AggregateNetworkProtocols!
}

input NetworkProtocolsCreateInput {
  masterProtocol: NetworkProtocolsCreateOneWithoutMasterProtocolInput
  name: String
  networkProtocolses: NetworkProtocolsCreateManyWithoutNetworkProtocolsesInput
  networkProtocolVersion: String
  networkses: NetworksCreateManyWithoutNetworkProtocolInput
  networkType: NetworkTypesCreateOneWithoutNetworkProtocolsesInput
  protocolDatas: ProtocolDataCreateManyWithoutNetworkProtocolInput
  protocolHandler: String
}

input NetworkProtocolsCreateManyWithoutNetworkProtocolsesInput {
  create: [NetworkProtocolsCreateWithoutNetworkProtocolsesInput!]
  connect: [NetworkProtocolsWhereUniqueInput!]
}

input NetworkProtocolsCreateManyWithoutNetworkTypeInput {
  create: [NetworkProtocolsCreateWithoutNetworkTypeInput!]
  connect: [NetworkProtocolsWhereUniqueInput!]
}

input NetworkProtocolsCreateOneWithoutMasterProtocolInput {
  create: NetworkProtocolsCreateWithoutMasterProtocolInput
  connect: NetworkProtocolsWhereUniqueInput
}

input NetworkProtocolsCreateOneWithoutNetworksesInput {
  create: NetworkProtocolsCreateWithoutNetworksesInput
  connect: NetworkProtocolsWhereUniqueInput
}

input NetworkProtocolsCreateOneWithoutProtocolDatasInput {
  create: NetworkProtocolsCreateWithoutProtocolDatasInput
  connect: NetworkProtocolsWhereUniqueInput
}

input NetworkProtocolsCreateWithoutMasterProtocolInput {
  name: String
  networkProtocolses: NetworkProtocolsCreateManyWithoutNetworkProtocolsesInput
  networkProtocolVersion: String
  networkses: NetworksCreateManyWithoutNetworkProtocolInput
  networkType: NetworkTypesCreateOneWithoutNetworkProtocolsesInput
  protocolDatas: ProtocolDataCreateManyWithoutNetworkProtocolInput
  protocolHandler: String
}

input NetworkProtocolsCreateWithoutNetworkProtocolsesInput {
  masterProtocol: NetworkProtocolsCreateOneWithoutMasterProtocolInput
  name: String
  networkProtocolVersion: String
  networkses: NetworksCreateManyWithoutNetworkProtocolInput
  networkType: NetworkTypesCreateOneWithoutNetworkProtocolsesInput
  protocolDatas: ProtocolDataCreateManyWithoutNetworkProtocolInput
  protocolHandler: String
}

input NetworkProtocolsCreateWithoutNetworksesInput {
  masterProtocol: NetworkProtocolsCreateOneWithoutMasterProtocolInput
  name: String
  networkProtocolses: NetworkProtocolsCreateManyWithoutNetworkProtocolsesInput
  networkProtocolVersion: String
  networkType: NetworkTypesCreateOneWithoutNetworkProtocolsesInput
  protocolDatas: ProtocolDataCreateManyWithoutNetworkProtocolInput
  protocolHandler: String
}

input NetworkProtocolsCreateWithoutNetworkTypeInput {
  masterProtocol: NetworkProtocolsCreateOneWithoutMasterProtocolInput
  name: String
  networkProtocolses: NetworkProtocolsCreateManyWithoutNetworkProtocolsesInput
  networkProtocolVersion: String
  networkses: NetworksCreateManyWithoutNetworkProtocolInput
  protocolDatas: ProtocolDataCreateManyWithoutNetworkProtocolInput
  protocolHandler: String
}

input NetworkProtocolsCreateWithoutProtocolDatasInput {
  masterProtocol: NetworkProtocolsCreateOneWithoutMasterProtocolInput
  name: String
  networkProtocolses: NetworkProtocolsCreateManyWithoutNetworkProtocolsesInput
  networkProtocolVersion: String
  networkses: NetworksCreateManyWithoutNetworkProtocolInput
  networkType: NetworkTypesCreateOneWithoutNetworkProtocolsesInput
  protocolHandler: String
}

type NetworkProtocolsEdge {
  node: NetworkProtocols!
  cursor: String!
}

enum NetworkProtocolsOrderByInput {
  id_ASC
  id_DESC
  name_ASC
  name_DESC
  networkProtocolVersion_ASC
  networkProtocolVersion_DESC
  protocolHandler_ASC
  protocolHandler_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type NetworkProtocolsPreviousValues {
  id: Int!
  name: String
  networkProtocolVersion: String
  protocolHandler: String
}

input NetworkProtocolsScalarWhereInput {
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  networkProtocolVersion: String
  networkProtocolVersion_not: String
  networkProtocolVersion_in: [String!]
  networkProtocolVersion_not_in: [String!]
  networkProtocolVersion_lt: String
  networkProtocolVersion_lte: String
  networkProtocolVersion_gt: String
  networkProtocolVersion_gte: String
  networkProtocolVersion_contains: String
  networkProtocolVersion_not_contains: String
  networkProtocolVersion_starts_with: String
  networkProtocolVersion_not_starts_with: String
  networkProtocolVersion_ends_with: String
  networkProtocolVersion_not_ends_with: String
  protocolHandler: String
  protocolHandler_not: String
  protocolHandler_in: [String!]
  protocolHandler_not_in: [String!]
  protocolHandler_lt: String
  protocolHandler_lte: String
  protocolHandler_gt: String
  protocolHandler_gte: String
  protocolHandler_contains: String
  protocolHandler_not_contains: String
  protocolHandler_starts_with: String
  protocolHandler_not_starts_with: String
  protocolHandler_ends_with: String
  protocolHandler_not_ends_with: String
  AND: [NetworkProtocolsScalarWhereInput!]
  OR: [NetworkProtocolsScalarWhereInput!]
  NOT: [NetworkProtocolsScalarWhereInput!]
}

type NetworkProtocolsSubscriptionPayload {
  mutation: MutationType!
  node: NetworkProtocols
  updatedFields: [String!]
  previousValues: NetworkProtocolsPreviousValues
}

input NetworkProtocolsSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: NetworkProtocolsWhereInput
  AND: [NetworkProtocolsSubscriptionWhereInput!]
  OR: [NetworkProtocolsSubscriptionWhereInput!]
  NOT: [NetworkProtocolsSubscriptionWhereInput!]
}

input NetworkProtocolsUpdateInput {
  masterProtocol: NetworkProtocolsUpdateOneWithoutMasterProtocolInput
  name: String
  networkProtocolses: NetworkProtocolsUpdateManyWithoutNetworkProtocolsesInput
  networkProtocolVersion: String
  networkses: NetworksUpdateManyWithoutNetworkProtocolInput
  networkType: NetworkTypesUpdateOneWithoutNetworkProtocolsesInput
  protocolDatas: ProtocolDataUpdateManyWithoutNetworkProtocolInput
  protocolHandler: String
}

input NetworkProtocolsUpdateManyDataInput {
  name: String
  networkProtocolVersion: String
  protocolHandler: String
}

input NetworkProtocolsUpdateManyMutationInput {
  name: String
  networkProtocolVersion: String
  protocolHandler: String
}

input NetworkProtocolsUpdateManyWithoutNetworkProtocolsesInput {
  create: [NetworkProtocolsCreateWithoutNetworkProtocolsesInput!]
  delete: [NetworkProtocolsWhereUniqueInput!]
  connect: [NetworkProtocolsWhereUniqueInput!]
  disconnect: [NetworkProtocolsWhereUniqueInput!]
  update: [NetworkProtocolsUpdateWithWhereUniqueWithoutNetworkProtocolsesInput!]
  upsert: [NetworkProtocolsUpsertWithWhereUniqueWithoutNetworkProtocolsesInput!]
  deleteMany: [NetworkProtocolsScalarWhereInput!]
  updateMany: [NetworkProtocolsUpdateManyWithWhereNestedInput!]
}

input NetworkProtocolsUpdateManyWithoutNetworkTypeInput {
  create: [NetworkProtocolsCreateWithoutNetworkTypeInput!]
  delete: [NetworkProtocolsWhereUniqueInput!]
  connect: [NetworkProtocolsWhereUniqueInput!]
  disconnect: [NetworkProtocolsWhereUniqueInput!]
  update: [NetworkProtocolsUpdateWithWhereUniqueWithoutNetworkTypeInput!]
  upsert: [NetworkProtocolsUpsertWithWhereUniqueWithoutNetworkTypeInput!]
  deleteMany: [NetworkProtocolsScalarWhereInput!]
  updateMany: [NetworkProtocolsUpdateManyWithWhereNestedInput!]
}

input NetworkProtocolsUpdateManyWithWhereNestedInput {
  where: NetworkProtocolsScalarWhereInput!
  data: NetworkProtocolsUpdateManyDataInput!
}

input NetworkProtocolsUpdateOneWithoutMasterProtocolInput {
  create: NetworkProtocolsCreateWithoutMasterProtocolInput
  update: NetworkProtocolsUpdateWithoutMasterProtocolDataInput
  upsert: NetworkProtocolsUpsertWithoutMasterProtocolInput
  delete: Boolean
  disconnect: Boolean
  connect: NetworkProtocolsWhereUniqueInput
}

input NetworkProtocolsUpdateOneWithoutNetworksesInput {
  create: NetworkProtocolsCreateWithoutNetworksesInput
  update: NetworkProtocolsUpdateWithoutNetworksesDataInput
  upsert: NetworkProtocolsUpsertWithoutNetworksesInput
  delete: Boolean
  disconnect: Boolean
  connect: NetworkProtocolsWhereUniqueInput
}

input NetworkProtocolsUpdateOneWithoutProtocolDatasInput {
  create: NetworkProtocolsCreateWithoutProtocolDatasInput
  update: NetworkProtocolsUpdateWithoutProtocolDatasDataInput
  upsert: NetworkProtocolsUpsertWithoutProtocolDatasInput
  delete: Boolean
  disconnect: Boolean
  connect: NetworkProtocolsWhereUniqueInput
}

input NetworkProtocolsUpdateWithoutMasterProtocolDataInput {
  name: String
  networkProtocolses: NetworkProtocolsUpdateManyWithoutNetworkProtocolsesInput
  networkProtocolVersion: String
  networkses: NetworksUpdateManyWithoutNetworkProtocolInput
  networkType: NetworkTypesUpdateOneWithoutNetworkProtocolsesInput
  protocolDatas: ProtocolDataUpdateManyWithoutNetworkProtocolInput
  protocolHandler: String
}

input NetworkProtocolsUpdateWithoutNetworkProtocolsesDataInput {
  masterProtocol: NetworkProtocolsUpdateOneWithoutMasterProtocolInput
  name: String
  networkProtocolVersion: String
  networkses: NetworksUpdateManyWithoutNetworkProtocolInput
  networkType: NetworkTypesUpdateOneWithoutNetworkProtocolsesInput
  protocolDatas: ProtocolDataUpdateManyWithoutNetworkProtocolInput
  protocolHandler: String
}

input NetworkProtocolsUpdateWithoutNetworksesDataInput {
  masterProtocol: NetworkProtocolsUpdateOneWithoutMasterProtocolInput
  name: String
  networkProtocolses: NetworkProtocolsUpdateManyWithoutNetworkProtocolsesInput
  networkProtocolVersion: String
  networkType: NetworkTypesUpdateOneWithoutNetworkProtocolsesInput
  protocolDatas: ProtocolDataUpdateManyWithoutNetworkProtocolInput
  protocolHandler: String
}

input NetworkProtocolsUpdateWithoutNetworkTypeDataInput {
  masterProtocol: NetworkProtocolsUpdateOneWithoutMasterProtocolInput
  name: String
  networkProtocolses: NetworkProtocolsUpdateManyWithoutNetworkProtocolsesInput
  networkProtocolVersion: String
  networkses: NetworksUpdateManyWithoutNetworkProtocolInput
  protocolDatas: ProtocolDataUpdateManyWithoutNetworkProtocolInput
  protocolHandler: String
}

input NetworkProtocolsUpdateWithoutProtocolDatasDataInput {
  masterProtocol: NetworkProtocolsUpdateOneWithoutMasterProtocolInput
  name: String
  networkProtocolses: NetworkProtocolsUpdateManyWithoutNetworkProtocolsesInput
  networkProtocolVersion: String
  networkses: NetworksUpdateManyWithoutNetworkProtocolInput
  networkType: NetworkTypesUpdateOneWithoutNetworkProtocolsesInput
  protocolHandler: String
}

input NetworkProtocolsUpdateWithWhereUniqueWithoutNetworkProtocolsesInput {
  where: NetworkProtocolsWhereUniqueInput!
  data: NetworkProtocolsUpdateWithoutNetworkProtocolsesDataInput!
}

input NetworkProtocolsUpdateWithWhereUniqueWithoutNetworkTypeInput {
  where: NetworkProtocolsWhereUniqueInput!
  data: NetworkProtocolsUpdateWithoutNetworkTypeDataInput!
}

input NetworkProtocolsUpsertWithoutMasterProtocolInput {
  update: NetworkProtocolsUpdateWithoutMasterProtocolDataInput!
  create: NetworkProtocolsCreateWithoutMasterProtocolInput!
}

input NetworkProtocolsUpsertWithoutNetworksesInput {
  update: NetworkProtocolsUpdateWithoutNetworksesDataInput!
  create: NetworkProtocolsCreateWithoutNetworksesInput!
}

input NetworkProtocolsUpsertWithoutProtocolDatasInput {
  update: NetworkProtocolsUpdateWithoutProtocolDatasDataInput!
  create: NetworkProtocolsCreateWithoutProtocolDatasInput!
}

input NetworkProtocolsUpsertWithWhereUniqueWithoutNetworkProtocolsesInput {
  where: NetworkProtocolsWhereUniqueInput!
  update: NetworkProtocolsUpdateWithoutNetworkProtocolsesDataInput!
  create: NetworkProtocolsCreateWithoutNetworkProtocolsesInput!
}

input NetworkProtocolsUpsertWithWhereUniqueWithoutNetworkTypeInput {
  where: NetworkProtocolsWhereUniqueInput!
  update: NetworkProtocolsUpdateWithoutNetworkTypeDataInput!
  create: NetworkProtocolsCreateWithoutNetworkTypeInput!
}

input NetworkProtocolsWhereInput {
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  masterProtocol: NetworkProtocolsWhereInput
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  networkProtocolses_every: NetworkProtocolsWhereInput
  networkProtocolses_some: NetworkProtocolsWhereInput
  networkProtocolses_none: NetworkProtocolsWhereInput
  networkProtocolVersion: String
  networkProtocolVersion_not: String
  networkProtocolVersion_in: [String!]
  networkProtocolVersion_not_in: [String!]
  networkProtocolVersion_lt: String
  networkProtocolVersion_lte: String
  networkProtocolVersion_gt: String
  networkProtocolVersion_gte: String
  networkProtocolVersion_contains: String
  networkProtocolVersion_not_contains: String
  networkProtocolVersion_starts_with: String
  networkProtocolVersion_not_starts_with: String
  networkProtocolVersion_ends_with: String
  networkProtocolVersion_not_ends_with: String
  networkses_every: NetworksWhereInput
  networkses_some: NetworksWhereInput
  networkses_none: NetworksWhereInput
  networkType: NetworkTypesWhereInput
  protocolDatas_every: ProtocolDataWhereInput
  protocolDatas_some: ProtocolDataWhereInput
  protocolDatas_none: ProtocolDataWhereInput
  protocolHandler: String
  protocolHandler_not: String
  protocolHandler_in: [String!]
  protocolHandler_not_in: [String!]
  protocolHandler_lt: String
  protocolHandler_lte: String
  protocolHandler_gt: String
  protocolHandler_gte: String
  protocolHandler_contains: String
  protocolHandler_not_contains: String
  protocolHandler_starts_with: String
  protocolHandler_not_starts_with: String
  protocolHandler_ends_with: String
  protocolHandler_not_ends_with: String
  AND: [NetworkProtocolsWhereInput!]
  OR: [NetworkProtocolsWhereInput!]
  NOT: [NetworkProtocolsWhereInput!]
}

input NetworkProtocolsWhereUniqueInput {
  id: Int
}

type NetworkProviders {
  id: Int!
  name: String
  networkses(where: NetworksWhereInput, orderBy: NetworksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Networks!]
}

type NetworkProvidersConnection {
  pageInfo: PageInfo!
  edges: [NetworkProvidersEdge]!
  aggregate: AggregateNetworkProviders!
}

input NetworkProvidersCreateInput {
  name: String
  networkses: NetworksCreateManyWithoutNetworkProviderInput
}

input NetworkProvidersCreateOneWithoutNetworksesInput {
  create: NetworkProvidersCreateWithoutNetworksesInput
  connect: NetworkProvidersWhereUniqueInput
}

input NetworkProvidersCreateWithoutNetworksesInput {
  name: String
}

type NetworkProvidersEdge {
  node: NetworkProviders!
  cursor: String!
}

enum NetworkProvidersOrderByInput {
  id_ASC
  id_DESC
  name_ASC
  name_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type NetworkProvidersPreviousValues {
  id: Int!
  name: String
}

type NetworkProvidersSubscriptionPayload {
  mutation: MutationType!
  node: NetworkProviders
  updatedFields: [String!]
  previousValues: NetworkProvidersPreviousValues
}

input NetworkProvidersSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: NetworkProvidersWhereInput
  AND: [NetworkProvidersSubscriptionWhereInput!]
  OR: [NetworkProvidersSubscriptionWhereInput!]
  NOT: [NetworkProvidersSubscriptionWhereInput!]
}

input NetworkProvidersUpdateInput {
  name: String
  networkses: NetworksUpdateManyWithoutNetworkProviderInput
}

input NetworkProvidersUpdateManyMutationInput {
  name: String
}

input NetworkProvidersUpdateOneWithoutNetworksesInput {
  create: NetworkProvidersCreateWithoutNetworksesInput
  update: NetworkProvidersUpdateWithoutNetworksesDataInput
  upsert: NetworkProvidersUpsertWithoutNetworksesInput
  delete: Boolean
  disconnect: Boolean
  connect: NetworkProvidersWhereUniqueInput
}

input NetworkProvidersUpdateWithoutNetworksesDataInput {
  name: String
}

input NetworkProvidersUpsertWithoutNetworksesInput {
  update: NetworkProvidersUpdateWithoutNetworksesDataInput!
  create: NetworkProvidersCreateWithoutNetworksesInput!
}

input NetworkProvidersWhereInput {
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  networkses_every: NetworksWhereInput
  networkses_some: NetworksWhereInput
  networkses_none: NetworksWhereInput
  AND: [NetworkProvidersWhereInput!]
  OR: [NetworkProvidersWhereInput!]
  NOT: [NetworkProvidersWhereInput!]
}

input NetworkProvidersWhereUniqueInput {
  id: Int
}

type Networks {
  baseUrl: String
  id: Int!
  name: String
  networkProtocol: NetworkProtocols
  networkProvider: NetworkProviders
  networkType: NetworkTypes
  protocolDatas(where: ProtocolDataWhereInput, orderBy: ProtocolDataOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [ProtocolData!]
  securityData: String
}

type NetworksConnection {
  pageInfo: PageInfo!
  edges: [NetworksEdge]!
  aggregate: AggregateNetworks!
}

input NetworksCreateInput {
  baseUrl: String
  name: String
  networkProtocol: NetworkProtocolsCreateOneWithoutNetworksesInput
  networkProvider: NetworkProvidersCreateOneWithoutNetworksesInput
  networkType: NetworkTypesCreateOneWithoutNetworksesInput
  protocolDatas: ProtocolDataCreateManyWithoutNetworkInput
  securityData: String
}

input NetworksCreateManyWithoutNetworkProtocolInput {
  create: [NetworksCreateWithoutNetworkProtocolInput!]
  connect: [NetworksWhereUniqueInput!]
}

input NetworksCreateManyWithoutNetworkProviderInput {
  create: [NetworksCreateWithoutNetworkProviderInput!]
  connect: [NetworksWhereUniqueInput!]
}

input NetworksCreateManyWithoutNetworkTypeInput {
  create: [NetworksCreateWithoutNetworkTypeInput!]
  connect: [NetworksWhereUniqueInput!]
}

input NetworksCreateOneWithoutProtocolDatasInput {
  create: NetworksCreateWithoutProtocolDatasInput
  connect: NetworksWhereUniqueInput
}

input NetworksCreateWithoutNetworkProtocolInput {
  baseUrl: String
  name: String
  networkProvider: NetworkProvidersCreateOneWithoutNetworksesInput
  networkType: NetworkTypesCreateOneWithoutNetworksesInput
  protocolDatas: ProtocolDataCreateManyWithoutNetworkInput
  securityData: String
}

input NetworksCreateWithoutNetworkProviderInput {
  baseUrl: String
  name: String
  networkProtocol: NetworkProtocolsCreateOneWithoutNetworksesInput
  networkType: NetworkTypesCreateOneWithoutNetworksesInput
  protocolDatas: ProtocolDataCreateManyWithoutNetworkInput
  securityData: String
}

input NetworksCreateWithoutNetworkTypeInput {
  baseUrl: String
  name: String
  networkProtocol: NetworkProtocolsCreateOneWithoutNetworksesInput
  networkProvider: NetworkProvidersCreateOneWithoutNetworksesInput
  protocolDatas: ProtocolDataCreateManyWithoutNetworkInput
  securityData: String
}

input NetworksCreateWithoutProtocolDatasInput {
  baseUrl: String
  name: String
  networkProtocol: NetworkProtocolsCreateOneWithoutNetworksesInput
  networkProvider: NetworkProvidersCreateOneWithoutNetworksesInput
  networkType: NetworkTypesCreateOneWithoutNetworksesInput
  securityData: String
}

type NetworksEdge {
  node: Networks!
  cursor: String!
}

enum NetworksOrderByInput {
  baseUrl_ASC
  baseUrl_DESC
  id_ASC
  id_DESC
  name_ASC
  name_DESC
  securityData_ASC
  securityData_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type NetworksPreviousValues {
  baseUrl: String
  id: Int!
  name: String
  securityData: String
}

input NetworksScalarWhereInput {
  baseUrl: String
  baseUrl_not: String
  baseUrl_in: [String!]
  baseUrl_not_in: [String!]
  baseUrl_lt: String
  baseUrl_lte: String
  baseUrl_gt: String
  baseUrl_gte: String
  baseUrl_contains: String
  baseUrl_not_contains: String
  baseUrl_starts_with: String
  baseUrl_not_starts_with: String
  baseUrl_ends_with: String
  baseUrl_not_ends_with: String
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  securityData: String
  securityData_not: String
  securityData_in: [String!]
  securityData_not_in: [String!]
  securityData_lt: String
  securityData_lte: String
  securityData_gt: String
  securityData_gte: String
  securityData_contains: String
  securityData_not_contains: String
  securityData_starts_with: String
  securityData_not_starts_with: String
  securityData_ends_with: String
  securityData_not_ends_with: String
  AND: [NetworksScalarWhereInput!]
  OR: [NetworksScalarWhereInput!]
  NOT: [NetworksScalarWhereInput!]
}

type NetworksSubscriptionPayload {
  mutation: MutationType!
  node: Networks
  updatedFields: [String!]
  previousValues: NetworksPreviousValues
}

input NetworksSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: NetworksWhereInput
  AND: [NetworksSubscriptionWhereInput!]
  OR: [NetworksSubscriptionWhereInput!]
  NOT: [NetworksSubscriptionWhereInput!]
}

input NetworksUpdateInput {
  baseUrl: String
  name: String
  networkProtocol: NetworkProtocolsUpdateOneWithoutNetworksesInput
  networkProvider: NetworkProvidersUpdateOneWithoutNetworksesInput
  networkType: NetworkTypesUpdateOneWithoutNetworksesInput
  protocolDatas: ProtocolDataUpdateManyWithoutNetworkInput
  securityData: String
}

input NetworksUpdateManyDataInput {
  baseUrl: String
  name: String
  securityData: String
}

input NetworksUpdateManyMutationInput {
  baseUrl: String
  name: String
  securityData: String
}

input NetworksUpdateManyWithoutNetworkProtocolInput {
  create: [NetworksCreateWithoutNetworkProtocolInput!]
  delete: [NetworksWhereUniqueInput!]
  connect: [NetworksWhereUniqueInput!]
  disconnect: [NetworksWhereUniqueInput!]
  update: [NetworksUpdateWithWhereUniqueWithoutNetworkProtocolInput!]
  upsert: [NetworksUpsertWithWhereUniqueWithoutNetworkProtocolInput!]
  deleteMany: [NetworksScalarWhereInput!]
  updateMany: [NetworksUpdateManyWithWhereNestedInput!]
}

input NetworksUpdateManyWithoutNetworkProviderInput {
  create: [NetworksCreateWithoutNetworkProviderInput!]
  delete: [NetworksWhereUniqueInput!]
  connect: [NetworksWhereUniqueInput!]
  disconnect: [NetworksWhereUniqueInput!]
  update: [NetworksUpdateWithWhereUniqueWithoutNetworkProviderInput!]
  upsert: [NetworksUpsertWithWhereUniqueWithoutNetworkProviderInput!]
  deleteMany: [NetworksScalarWhereInput!]
  updateMany: [NetworksUpdateManyWithWhereNestedInput!]
}

input NetworksUpdateManyWithoutNetworkTypeInput {
  create: [NetworksCreateWithoutNetworkTypeInput!]
  delete: [NetworksWhereUniqueInput!]
  connect: [NetworksWhereUniqueInput!]
  disconnect: [NetworksWhereUniqueInput!]
  update: [NetworksUpdateWithWhereUniqueWithoutNetworkTypeInput!]
  upsert: [NetworksUpsertWithWhereUniqueWithoutNetworkTypeInput!]
  deleteMany: [NetworksScalarWhereInput!]
  updateMany: [NetworksUpdateManyWithWhereNestedInput!]
}

input NetworksUpdateManyWithWhereNestedInput {
  where: NetworksScalarWhereInput!
  data: NetworksUpdateManyDataInput!
}

input NetworksUpdateOneWithoutProtocolDatasInput {
  create: NetworksCreateWithoutProtocolDatasInput
  update: NetworksUpdateWithoutProtocolDatasDataInput
  upsert: NetworksUpsertWithoutProtocolDatasInput
  delete: Boolean
  disconnect: Boolean
  connect: NetworksWhereUniqueInput
}

input NetworksUpdateWithoutNetworkProtocolDataInput {
  baseUrl: String
  name: String
  networkProvider: NetworkProvidersUpdateOneWithoutNetworksesInput
  networkType: NetworkTypesUpdateOneWithoutNetworksesInput
  protocolDatas: ProtocolDataUpdateManyWithoutNetworkInput
  securityData: String
}

input NetworksUpdateWithoutNetworkProviderDataInput {
  baseUrl: String
  name: String
  networkProtocol: NetworkProtocolsUpdateOneWithoutNetworksesInput
  networkType: NetworkTypesUpdateOneWithoutNetworksesInput
  protocolDatas: ProtocolDataUpdateManyWithoutNetworkInput
  securityData: String
}

input NetworksUpdateWithoutNetworkTypeDataInput {
  baseUrl: String
  name: String
  networkProtocol: NetworkProtocolsUpdateOneWithoutNetworksesInput
  networkProvider: NetworkProvidersUpdateOneWithoutNetworksesInput
  protocolDatas: ProtocolDataUpdateManyWithoutNetworkInput
  securityData: String
}

input NetworksUpdateWithoutProtocolDatasDataInput {
  baseUrl: String
  name: String
  networkProtocol: NetworkProtocolsUpdateOneWithoutNetworksesInput
  networkProvider: NetworkProvidersUpdateOneWithoutNetworksesInput
  networkType: NetworkTypesUpdateOneWithoutNetworksesInput
  securityData: String
}

input NetworksUpdateWithWhereUniqueWithoutNetworkProtocolInput {
  where: NetworksWhereUniqueInput!
  data: NetworksUpdateWithoutNetworkProtocolDataInput!
}

input NetworksUpdateWithWhereUniqueWithoutNetworkProviderInput {
  where: NetworksWhereUniqueInput!
  data: NetworksUpdateWithoutNetworkProviderDataInput!
}

input NetworksUpdateWithWhereUniqueWithoutNetworkTypeInput {
  where: NetworksWhereUniqueInput!
  data: NetworksUpdateWithoutNetworkTypeDataInput!
}

input NetworksUpsertWithoutProtocolDatasInput {
  update: NetworksUpdateWithoutProtocolDatasDataInput!
  create: NetworksCreateWithoutProtocolDatasInput!
}

input NetworksUpsertWithWhereUniqueWithoutNetworkProtocolInput {
  where: NetworksWhereUniqueInput!
  update: NetworksUpdateWithoutNetworkProtocolDataInput!
  create: NetworksCreateWithoutNetworkProtocolInput!
}

input NetworksUpsertWithWhereUniqueWithoutNetworkProviderInput {
  where: NetworksWhereUniqueInput!
  update: NetworksUpdateWithoutNetworkProviderDataInput!
  create: NetworksCreateWithoutNetworkProviderInput!
}

input NetworksUpsertWithWhereUniqueWithoutNetworkTypeInput {
  where: NetworksWhereUniqueInput!
  update: NetworksUpdateWithoutNetworkTypeDataInput!
  create: NetworksCreateWithoutNetworkTypeInput!
}

input NetworksWhereInput {
  baseUrl: String
  baseUrl_not: String
  baseUrl_in: [String!]
  baseUrl_not_in: [String!]
  baseUrl_lt: String
  baseUrl_lte: String
  baseUrl_gt: String
  baseUrl_gte: String
  baseUrl_contains: String
  baseUrl_not_contains: String
  baseUrl_starts_with: String
  baseUrl_not_starts_with: String
  baseUrl_ends_with: String
  baseUrl_not_ends_with: String
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  networkProtocol: NetworkProtocolsWhereInput
  networkProvider: NetworkProvidersWhereInput
  networkType: NetworkTypesWhereInput
  protocolDatas_every: ProtocolDataWhereInput
  protocolDatas_some: ProtocolDataWhereInput
  protocolDatas_none: ProtocolDataWhereInput
  securityData: String
  securityData_not: String
  securityData_in: [String!]
  securityData_not_in: [String!]
  securityData_lt: String
  securityData_lte: String
  securityData_gt: String
  securityData_gte: String
  securityData_contains: String
  securityData_not_contains: String
  securityData_starts_with: String
  securityData_not_starts_with: String
  securityData_ends_with: String
  securityData_not_ends_with: String
  AND: [NetworksWhereInput!]
  OR: [NetworksWhereInput!]
  NOT: [NetworksWhereInput!]
}

input NetworksWhereUniqueInput {
  id: Int
}

type NetworkTypes {
  applicationNetworkTypeLinkses(where: ApplicationNetworkTypeLinksWhereInput, orderBy: ApplicationNetworkTypeLinksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [ApplicationNetworkTypeLinks!]
  companyNetworkTypeLinkses(where: CompanyNetworkTypeLinksWhereInput, orderBy: CompanyNetworkTypeLinksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [CompanyNetworkTypeLinks!]
  deviceNetworkTypeLinkses(where: DeviceNetworkTypeLinksWhereInput, orderBy: DeviceNetworkTypeLinksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [DeviceNetworkTypeLinks!]
  deviceProfileses(where: DeviceProfilesWhereInput, orderBy: DeviceProfilesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [DeviceProfiles!]
  id: Int!
  name: String
  networkProtocolses(where: NetworkProtocolsWhereInput, orderBy: NetworkProtocolsOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [NetworkProtocols!]
  networkses(where: NetworksWhereInput, orderBy: NetworksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Networks!]
}

type NetworkTypesConnection {
  pageInfo: PageInfo!
  edges: [NetworkTypesEdge]!
  aggregate: AggregateNetworkTypes!
}

input NetworkTypesCreateInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  deviceProfileses: DeviceProfilesCreateManyWithoutNetworkTypeInput
  name: String
  networkProtocolses: NetworkProtocolsCreateManyWithoutNetworkTypeInput
  networkses: NetworksCreateManyWithoutNetworkTypeInput
}

input NetworkTypesCreateOneWithoutApplicationNetworkTypeLinksesInput {
  create: NetworkTypesCreateWithoutApplicationNetworkTypeLinksesInput
  connect: NetworkTypesWhereUniqueInput
}

input NetworkTypesCreateOneWithoutCompanyNetworkTypeLinksesInput {
  create: NetworkTypesCreateWithoutCompanyNetworkTypeLinksesInput
  connect: NetworkTypesWhereUniqueInput
}

input NetworkTypesCreateOneWithoutDeviceNetworkTypeLinksesInput {
  create: NetworkTypesCreateWithoutDeviceNetworkTypeLinksesInput
  connect: NetworkTypesWhereUniqueInput
}

input NetworkTypesCreateOneWithoutDeviceProfilesesInput {
  create: NetworkTypesCreateWithoutDeviceProfilesesInput
  connect: NetworkTypesWhereUniqueInput
}

input NetworkTypesCreateOneWithoutNetworkProtocolsesInput {
  create: NetworkTypesCreateWithoutNetworkProtocolsesInput
  connect: NetworkTypesWhereUniqueInput
}

input NetworkTypesCreateOneWithoutNetworksesInput {
  create: NetworkTypesCreateWithoutNetworksesInput
  connect: NetworkTypesWhereUniqueInput
}

input NetworkTypesCreateWithoutApplicationNetworkTypeLinksesInput {
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  deviceProfileses: DeviceProfilesCreateManyWithoutNetworkTypeInput
  name: String
  networkProtocolses: NetworkProtocolsCreateManyWithoutNetworkTypeInput
  networkses: NetworksCreateManyWithoutNetworkTypeInput
}

input NetworkTypesCreateWithoutCompanyNetworkTypeLinksesInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  deviceProfileses: DeviceProfilesCreateManyWithoutNetworkTypeInput
  name: String
  networkProtocolses: NetworkProtocolsCreateManyWithoutNetworkTypeInput
  networkses: NetworksCreateManyWithoutNetworkTypeInput
}

input NetworkTypesCreateWithoutDeviceNetworkTypeLinksesInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  deviceProfileses: DeviceProfilesCreateManyWithoutNetworkTypeInput
  name: String
  networkProtocolses: NetworkProtocolsCreateManyWithoutNetworkTypeInput
  networkses: NetworksCreateManyWithoutNetworkTypeInput
}

input NetworkTypesCreateWithoutDeviceProfilesesInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  name: String
  networkProtocolses: NetworkProtocolsCreateManyWithoutNetworkTypeInput
  networkses: NetworksCreateManyWithoutNetworkTypeInput
}

input NetworkTypesCreateWithoutNetworkProtocolsesInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  deviceProfileses: DeviceProfilesCreateManyWithoutNetworkTypeInput
  name: String
  networkses: NetworksCreateManyWithoutNetworkTypeInput
}

input NetworkTypesCreateWithoutNetworksesInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksCreateManyWithoutNetworkTypeInput
  deviceProfileses: DeviceProfilesCreateManyWithoutNetworkTypeInput
  name: String
  networkProtocolses: NetworkProtocolsCreateManyWithoutNetworkTypeInput
}

type NetworkTypesEdge {
  node: NetworkTypes!
  cursor: String!
}

enum NetworkTypesOrderByInput {
  id_ASC
  id_DESC
  name_ASC
  name_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type NetworkTypesPreviousValues {
  id: Int!
  name: String
}

type NetworkTypesSubscriptionPayload {
  mutation: MutationType!
  node: NetworkTypes
  updatedFields: [String!]
  previousValues: NetworkTypesPreviousValues
}

input NetworkTypesSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: NetworkTypesWhereInput
  AND: [NetworkTypesSubscriptionWhereInput!]
  OR: [NetworkTypesSubscriptionWhereInput!]
  NOT: [NetworkTypesSubscriptionWhereInput!]
}

input NetworkTypesUpdateInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  deviceProfileses: DeviceProfilesUpdateManyWithoutNetworkTypeInput
  name: String
  networkProtocolses: NetworkProtocolsUpdateManyWithoutNetworkTypeInput
  networkses: NetworksUpdateManyWithoutNetworkTypeInput
}

input NetworkTypesUpdateManyMutationInput {
  name: String
}

input NetworkTypesUpdateOneWithoutApplicationNetworkTypeLinksesInput {
  create: NetworkTypesCreateWithoutApplicationNetworkTypeLinksesInput
  update: NetworkTypesUpdateWithoutApplicationNetworkTypeLinksesDataInput
  upsert: NetworkTypesUpsertWithoutApplicationNetworkTypeLinksesInput
  delete: Boolean
  disconnect: Boolean
  connect: NetworkTypesWhereUniqueInput
}

input NetworkTypesUpdateOneWithoutCompanyNetworkTypeLinksesInput {
  create: NetworkTypesCreateWithoutCompanyNetworkTypeLinksesInput
  update: NetworkTypesUpdateWithoutCompanyNetworkTypeLinksesDataInput
  upsert: NetworkTypesUpsertWithoutCompanyNetworkTypeLinksesInput
  delete: Boolean
  disconnect: Boolean
  connect: NetworkTypesWhereUniqueInput
}

input NetworkTypesUpdateOneWithoutDeviceNetworkTypeLinksesInput {
  create: NetworkTypesCreateWithoutDeviceNetworkTypeLinksesInput
  update: NetworkTypesUpdateWithoutDeviceNetworkTypeLinksesDataInput
  upsert: NetworkTypesUpsertWithoutDeviceNetworkTypeLinksesInput
  delete: Boolean
  disconnect: Boolean
  connect: NetworkTypesWhereUniqueInput
}

input NetworkTypesUpdateOneWithoutDeviceProfilesesInput {
  create: NetworkTypesCreateWithoutDeviceProfilesesInput
  update: NetworkTypesUpdateWithoutDeviceProfilesesDataInput
  upsert: NetworkTypesUpsertWithoutDeviceProfilesesInput
  delete: Boolean
  disconnect: Boolean
  connect: NetworkTypesWhereUniqueInput
}

input NetworkTypesUpdateOneWithoutNetworkProtocolsesInput {
  create: NetworkTypesCreateWithoutNetworkProtocolsesInput
  update: NetworkTypesUpdateWithoutNetworkProtocolsesDataInput
  upsert: NetworkTypesUpsertWithoutNetworkProtocolsesInput
  delete: Boolean
  disconnect: Boolean
  connect: NetworkTypesWhereUniqueInput
}

input NetworkTypesUpdateOneWithoutNetworksesInput {
  create: NetworkTypesCreateWithoutNetworksesInput
  update: NetworkTypesUpdateWithoutNetworksesDataInput
  upsert: NetworkTypesUpsertWithoutNetworksesInput
  delete: Boolean
  disconnect: Boolean
  connect: NetworkTypesWhereUniqueInput
}

input NetworkTypesUpdateWithoutApplicationNetworkTypeLinksesDataInput {
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  deviceProfileses: DeviceProfilesUpdateManyWithoutNetworkTypeInput
  name: String
  networkProtocolses: NetworkProtocolsUpdateManyWithoutNetworkTypeInput
  networkses: NetworksUpdateManyWithoutNetworkTypeInput
}

input NetworkTypesUpdateWithoutCompanyNetworkTypeLinksesDataInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  deviceProfileses: DeviceProfilesUpdateManyWithoutNetworkTypeInput
  name: String
  networkProtocolses: NetworkProtocolsUpdateManyWithoutNetworkTypeInput
  networkses: NetworksUpdateManyWithoutNetworkTypeInput
}

input NetworkTypesUpdateWithoutDeviceNetworkTypeLinksesDataInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  deviceProfileses: DeviceProfilesUpdateManyWithoutNetworkTypeInput
  name: String
  networkProtocolses: NetworkProtocolsUpdateManyWithoutNetworkTypeInput
  networkses: NetworksUpdateManyWithoutNetworkTypeInput
}

input NetworkTypesUpdateWithoutDeviceProfilesesDataInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  name: String
  networkProtocolses: NetworkProtocolsUpdateManyWithoutNetworkTypeInput
  networkses: NetworksUpdateManyWithoutNetworkTypeInput
}

input NetworkTypesUpdateWithoutNetworkProtocolsesDataInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  deviceProfileses: DeviceProfilesUpdateManyWithoutNetworkTypeInput
  name: String
  networkses: NetworksUpdateManyWithoutNetworkTypeInput
}

input NetworkTypesUpdateWithoutNetworksesDataInput {
  applicationNetworkTypeLinkses: ApplicationNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  companyNetworkTypeLinkses: CompanyNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  deviceNetworkTypeLinkses: DeviceNetworkTypeLinksUpdateManyWithoutNetworkTypeInput
  deviceProfileses: DeviceProfilesUpdateManyWithoutNetworkTypeInput
  name: String
  networkProtocolses: NetworkProtocolsUpdateManyWithoutNetworkTypeInput
}

input NetworkTypesUpsertWithoutApplicationNetworkTypeLinksesInput {
  update: NetworkTypesUpdateWithoutApplicationNetworkTypeLinksesDataInput!
  create: NetworkTypesCreateWithoutApplicationNetworkTypeLinksesInput!
}

input NetworkTypesUpsertWithoutCompanyNetworkTypeLinksesInput {
  update: NetworkTypesUpdateWithoutCompanyNetworkTypeLinksesDataInput!
  create: NetworkTypesCreateWithoutCompanyNetworkTypeLinksesInput!
}

input NetworkTypesUpsertWithoutDeviceNetworkTypeLinksesInput {
  update: NetworkTypesUpdateWithoutDeviceNetworkTypeLinksesDataInput!
  create: NetworkTypesCreateWithoutDeviceNetworkTypeLinksesInput!
}

input NetworkTypesUpsertWithoutDeviceProfilesesInput {
  update: NetworkTypesUpdateWithoutDeviceProfilesesDataInput!
  create: NetworkTypesCreateWithoutDeviceProfilesesInput!
}

input NetworkTypesUpsertWithoutNetworkProtocolsesInput {
  update: NetworkTypesUpdateWithoutNetworkProtocolsesDataInput!
  create: NetworkTypesCreateWithoutNetworkProtocolsesInput!
}

input NetworkTypesUpsertWithoutNetworksesInput {
  update: NetworkTypesUpdateWithoutNetworksesDataInput!
  create: NetworkTypesCreateWithoutNetworksesInput!
}

input NetworkTypesWhereInput {
  applicationNetworkTypeLinkses_every: ApplicationNetworkTypeLinksWhereInput
  applicationNetworkTypeLinkses_some: ApplicationNetworkTypeLinksWhereInput
  applicationNetworkTypeLinkses_none: ApplicationNetworkTypeLinksWhereInput
  companyNetworkTypeLinkses_every: CompanyNetworkTypeLinksWhereInput
  companyNetworkTypeLinkses_some: CompanyNetworkTypeLinksWhereInput
  companyNetworkTypeLinkses_none: CompanyNetworkTypeLinksWhereInput
  deviceNetworkTypeLinkses_every: DeviceNetworkTypeLinksWhereInput
  deviceNetworkTypeLinkses_some: DeviceNetworkTypeLinksWhereInput
  deviceNetworkTypeLinkses_none: DeviceNetworkTypeLinksWhereInput
  deviceProfileses_every: DeviceProfilesWhereInput
  deviceProfileses_some: DeviceProfilesWhereInput
  deviceProfileses_none: DeviceProfilesWhereInput
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  networkProtocolses_every: NetworkProtocolsWhereInput
  networkProtocolses_some: NetworkProtocolsWhereInput
  networkProtocolses_none: NetworkProtocolsWhereInput
  networkses_every: NetworksWhereInput
  networkses_some: NetworksWhereInput
  networkses_none: NetworksWhereInput
  AND: [NetworkTypesWhereInput!]
  OR: [NetworkTypesWhereInput!]
  NOT: [NetworkTypesWhereInput!]
}

input NetworkTypesWhereUniqueInput {
  id: Int
}

interface Node {
  id: ID!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type PasswordPolicies {
  company: Companies
  id: Int!
  ruleRegExp: String
  ruleText: String
}

type PasswordPoliciesConnection {
  pageInfo: PageInfo!
  edges: [PasswordPoliciesEdge]!
  aggregate: AggregatePasswordPolicies!
}

input PasswordPoliciesCreateInput {
  company: CompaniesCreateOneWithoutPasswordPoliciesesInput
  ruleRegExp: String
  ruleText: String
}

input PasswordPoliciesCreateManyWithoutCompanyInput {
  create: [PasswordPoliciesCreateWithoutCompanyInput!]
  connect: [PasswordPoliciesWhereUniqueInput!]
}

input PasswordPoliciesCreateWithoutCompanyInput {
  ruleRegExp: String
  ruleText: String
}

type PasswordPoliciesEdge {
  node: PasswordPolicies!
  cursor: String!
}

enum PasswordPoliciesOrderByInput {
  id_ASC
  id_DESC
  ruleRegExp_ASC
  ruleRegExp_DESC
  ruleText_ASC
  ruleText_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type PasswordPoliciesPreviousValues {
  id: Int!
  ruleRegExp: String
  ruleText: String
}

input PasswordPoliciesScalarWhereInput {
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  ruleRegExp: String
  ruleRegExp_not: String
  ruleRegExp_in: [String!]
  ruleRegExp_not_in: [String!]
  ruleRegExp_lt: String
  ruleRegExp_lte: String
  ruleRegExp_gt: String
  ruleRegExp_gte: String
  ruleRegExp_contains: String
  ruleRegExp_not_contains: String
  ruleRegExp_starts_with: String
  ruleRegExp_not_starts_with: String
  ruleRegExp_ends_with: String
  ruleRegExp_not_ends_with: String
  ruleText: String
  ruleText_not: String
  ruleText_in: [String!]
  ruleText_not_in: [String!]
  ruleText_lt: String
  ruleText_lte: String
  ruleText_gt: String
  ruleText_gte: String
  ruleText_contains: String
  ruleText_not_contains: String
  ruleText_starts_with: String
  ruleText_not_starts_with: String
  ruleText_ends_with: String
  ruleText_not_ends_with: String
  AND: [PasswordPoliciesScalarWhereInput!]
  OR: [PasswordPoliciesScalarWhereInput!]
  NOT: [PasswordPoliciesScalarWhereInput!]
}

type PasswordPoliciesSubscriptionPayload {
  mutation: MutationType!
  node: PasswordPolicies
  updatedFields: [String!]
  previousValues: PasswordPoliciesPreviousValues
}

input PasswordPoliciesSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: PasswordPoliciesWhereInput
  AND: [PasswordPoliciesSubscriptionWhereInput!]
  OR: [PasswordPoliciesSubscriptionWhereInput!]
  NOT: [PasswordPoliciesSubscriptionWhereInput!]
}

input PasswordPoliciesUpdateInput {
  company: CompaniesUpdateOneWithoutPasswordPoliciesesInput
  ruleRegExp: String
  ruleText: String
}

input PasswordPoliciesUpdateManyDataInput {
  ruleRegExp: String
  ruleText: String
}

input PasswordPoliciesUpdateManyMutationInput {
  ruleRegExp: String
  ruleText: String
}

input PasswordPoliciesUpdateManyWithoutCompanyInput {
  create: [PasswordPoliciesCreateWithoutCompanyInput!]
  delete: [PasswordPoliciesWhereUniqueInput!]
  connect: [PasswordPoliciesWhereUniqueInput!]
  disconnect: [PasswordPoliciesWhereUniqueInput!]
  update: [PasswordPoliciesUpdateWithWhereUniqueWithoutCompanyInput!]
  upsert: [PasswordPoliciesUpsertWithWhereUniqueWithoutCompanyInput!]
  deleteMany: [PasswordPoliciesScalarWhereInput!]
  updateMany: [PasswordPoliciesUpdateManyWithWhereNestedInput!]
}

input PasswordPoliciesUpdateManyWithWhereNestedInput {
  where: PasswordPoliciesScalarWhereInput!
  data: PasswordPoliciesUpdateManyDataInput!
}

input PasswordPoliciesUpdateWithoutCompanyDataInput {
  ruleRegExp: String
  ruleText: String
}

input PasswordPoliciesUpdateWithWhereUniqueWithoutCompanyInput {
  where: PasswordPoliciesWhereUniqueInput!
  data: PasswordPoliciesUpdateWithoutCompanyDataInput!
}

input PasswordPoliciesUpsertWithWhereUniqueWithoutCompanyInput {
  where: PasswordPoliciesWhereUniqueInput!
  update: PasswordPoliciesUpdateWithoutCompanyDataInput!
  create: PasswordPoliciesCreateWithoutCompanyInput!
}

input PasswordPoliciesWhereInput {
  company: CompaniesWhereInput
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  ruleRegExp: String
  ruleRegExp_not: String
  ruleRegExp_in: [String!]
  ruleRegExp_not_in: [String!]
  ruleRegExp_lt: String
  ruleRegExp_lte: String
  ruleRegExp_gt: String
  ruleRegExp_gte: String
  ruleRegExp_contains: String
  ruleRegExp_not_contains: String
  ruleRegExp_starts_with: String
  ruleRegExp_not_starts_with: String
  ruleRegExp_ends_with: String
  ruleRegExp_not_ends_with: String
  ruleText: String
  ruleText_not: String
  ruleText_in: [String!]
  ruleText_not_in: [String!]
  ruleText_lt: String
  ruleText_lte: String
  ruleText_gt: String
  ruleText_gte: String
  ruleText_contains: String
  ruleText_not_contains: String
  ruleText_starts_with: String
  ruleText_not_starts_with: String
  ruleText_ends_with: String
  ruleText_not_ends_with: String
  AND: [PasswordPoliciesWhereInput!]
  OR: [PasswordPoliciesWhereInput!]
  NOT: [PasswordPoliciesWhereInput!]
}

input PasswordPoliciesWhereUniqueInput {
  id: Int
}

type ProtocolData {
  dataIdentifier: String
  dataValue: String
  id: Int!
  network: Networks
  networkProtocol: NetworkProtocols
}

type ProtocolDataConnection {
  pageInfo: PageInfo!
  edges: [ProtocolDataEdge]!
  aggregate: AggregateProtocolData!
}

input ProtocolDataCreateInput {
  dataIdentifier: String
  dataValue: String
  network: NetworksCreateOneWithoutProtocolDatasInput
  networkProtocol: NetworkProtocolsCreateOneWithoutProtocolDatasInput
}

input ProtocolDataCreateManyWithoutNetworkInput {
  create: [ProtocolDataCreateWithoutNetworkInput!]
  connect: [ProtocolDataWhereUniqueInput!]
}

input ProtocolDataCreateManyWithoutNetworkProtocolInput {
  create: [ProtocolDataCreateWithoutNetworkProtocolInput!]
  connect: [ProtocolDataWhereUniqueInput!]
}

input ProtocolDataCreateWithoutNetworkInput {
  dataIdentifier: String
  dataValue: String
  networkProtocol: NetworkProtocolsCreateOneWithoutProtocolDatasInput
}

input ProtocolDataCreateWithoutNetworkProtocolInput {
  dataIdentifier: String
  dataValue: String
  network: NetworksCreateOneWithoutProtocolDatasInput
}

type ProtocolDataEdge {
  node: ProtocolData!
  cursor: String!
}

enum ProtocolDataOrderByInput {
  dataIdentifier_ASC
  dataIdentifier_DESC
  dataValue_ASC
  dataValue_DESC
  id_ASC
  id_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type ProtocolDataPreviousValues {
  dataIdentifier: String
  dataValue: String
  id: Int!
}

input ProtocolDataScalarWhereInput {
  dataIdentifier: String
  dataIdentifier_not: String
  dataIdentifier_in: [String!]
  dataIdentifier_not_in: [String!]
  dataIdentifier_lt: String
  dataIdentifier_lte: String
  dataIdentifier_gt: String
  dataIdentifier_gte: String
  dataIdentifier_contains: String
  dataIdentifier_not_contains: String
  dataIdentifier_starts_with: String
  dataIdentifier_not_starts_with: String
  dataIdentifier_ends_with: String
  dataIdentifier_not_ends_with: String
  dataValue: String
  dataValue_not: String
  dataValue_in: [String!]
  dataValue_not_in: [String!]
  dataValue_lt: String
  dataValue_lte: String
  dataValue_gt: String
  dataValue_gte: String
  dataValue_contains: String
  dataValue_not_contains: String
  dataValue_starts_with: String
  dataValue_not_starts_with: String
  dataValue_ends_with: String
  dataValue_not_ends_with: String
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  AND: [ProtocolDataScalarWhereInput!]
  OR: [ProtocolDataScalarWhereInput!]
  NOT: [ProtocolDataScalarWhereInput!]
}

type ProtocolDataSubscriptionPayload {
  mutation: MutationType!
  node: ProtocolData
  updatedFields: [String!]
  previousValues: ProtocolDataPreviousValues
}

input ProtocolDataSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: ProtocolDataWhereInput
  AND: [ProtocolDataSubscriptionWhereInput!]
  OR: [ProtocolDataSubscriptionWhereInput!]
  NOT: [ProtocolDataSubscriptionWhereInput!]
}

input ProtocolDataUpdateInput {
  dataIdentifier: String
  dataValue: String
  network: NetworksUpdateOneWithoutProtocolDatasInput
  networkProtocol: NetworkProtocolsUpdateOneWithoutProtocolDatasInput
}

input ProtocolDataUpdateManyDataInput {
  dataIdentifier: String
  dataValue: String
}

input ProtocolDataUpdateManyMutationInput {
  dataIdentifier: String
  dataValue: String
}

input ProtocolDataUpdateManyWithoutNetworkInput {
  create: [ProtocolDataCreateWithoutNetworkInput!]
  delete: [ProtocolDataWhereUniqueInput!]
  connect: [ProtocolDataWhereUniqueInput!]
  disconnect: [ProtocolDataWhereUniqueInput!]
  update: [ProtocolDataUpdateWithWhereUniqueWithoutNetworkInput!]
  upsert: [ProtocolDataUpsertWithWhereUniqueWithoutNetworkInput!]
  deleteMany: [ProtocolDataScalarWhereInput!]
  updateMany: [ProtocolDataUpdateManyWithWhereNestedInput!]
}

input ProtocolDataUpdateManyWithoutNetworkProtocolInput {
  create: [ProtocolDataCreateWithoutNetworkProtocolInput!]
  delete: [ProtocolDataWhereUniqueInput!]
  connect: [ProtocolDataWhereUniqueInput!]
  disconnect: [ProtocolDataWhereUniqueInput!]
  update: [ProtocolDataUpdateWithWhereUniqueWithoutNetworkProtocolInput!]
  upsert: [ProtocolDataUpsertWithWhereUniqueWithoutNetworkProtocolInput!]
  deleteMany: [ProtocolDataScalarWhereInput!]
  updateMany: [ProtocolDataUpdateManyWithWhereNestedInput!]
}

input ProtocolDataUpdateManyWithWhereNestedInput {
  where: ProtocolDataScalarWhereInput!
  data: ProtocolDataUpdateManyDataInput!
}

input ProtocolDataUpdateWithoutNetworkDataInput {
  dataIdentifier: String
  dataValue: String
  networkProtocol: NetworkProtocolsUpdateOneWithoutProtocolDatasInput
}

input ProtocolDataUpdateWithoutNetworkProtocolDataInput {
  dataIdentifier: String
  dataValue: String
  network: NetworksUpdateOneWithoutProtocolDatasInput
}

input ProtocolDataUpdateWithWhereUniqueWithoutNetworkInput {
  where: ProtocolDataWhereUniqueInput!
  data: ProtocolDataUpdateWithoutNetworkDataInput!
}

input ProtocolDataUpdateWithWhereUniqueWithoutNetworkProtocolInput {
  where: ProtocolDataWhereUniqueInput!
  data: ProtocolDataUpdateWithoutNetworkProtocolDataInput!
}

input ProtocolDataUpsertWithWhereUniqueWithoutNetworkInput {
  where: ProtocolDataWhereUniqueInput!
  update: ProtocolDataUpdateWithoutNetworkDataInput!
  create: ProtocolDataCreateWithoutNetworkInput!
}

input ProtocolDataUpsertWithWhereUniqueWithoutNetworkProtocolInput {
  where: ProtocolDataWhereUniqueInput!
  update: ProtocolDataUpdateWithoutNetworkProtocolDataInput!
  create: ProtocolDataCreateWithoutNetworkProtocolInput!
}

input ProtocolDataWhereInput {
  dataIdentifier: String
  dataIdentifier_not: String
  dataIdentifier_in: [String!]
  dataIdentifier_not_in: [String!]
  dataIdentifier_lt: String
  dataIdentifier_lte: String
  dataIdentifier_gt: String
  dataIdentifier_gte: String
  dataIdentifier_contains: String
  dataIdentifier_not_contains: String
  dataIdentifier_starts_with: String
  dataIdentifier_not_starts_with: String
  dataIdentifier_ends_with: String
  dataIdentifier_not_ends_with: String
  dataValue: String
  dataValue_not: String
  dataValue_in: [String!]
  dataValue_not_in: [String!]
  dataValue_lt: String
  dataValue_lte: String
  dataValue_gt: String
  dataValue_gte: String
  dataValue_contains: String
  dataValue_not_contains: String
  dataValue_starts_with: String
  dataValue_not_starts_with: String
  dataValue_ends_with: String
  dataValue_not_ends_with: String
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  network: NetworksWhereInput
  networkProtocol: NetworkProtocolsWhereInput
  AND: [ProtocolDataWhereInput!]
  OR: [ProtocolDataWhereInput!]
  NOT: [ProtocolDataWhereInput!]
}

input ProtocolDataWhereUniqueInput {
  id: Int
}

type Query {
  applicationNetworkTypeLinks(where: ApplicationNetworkTypeLinksWhereUniqueInput!): ApplicationNetworkTypeLinks
  applicationNetworkTypeLinkses(where: ApplicationNetworkTypeLinksWhereInput, orderBy: ApplicationNetworkTypeLinksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [ApplicationNetworkTypeLinks]!
  applicationNetworkTypeLinksesConnection(where: ApplicationNetworkTypeLinksWhereInput, orderBy: ApplicationNetworkTypeLinksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): ApplicationNetworkTypeLinksConnection!
  applications(where: ApplicationsWhereUniqueInput!): Applications
  applicationses(where: ApplicationsWhereInput, orderBy: ApplicationsOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Applications]!
  applicationsesConnection(where: ApplicationsWhereInput, orderBy: ApplicationsOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): ApplicationsConnection!
  companies(where: CompaniesWhereUniqueInput!): Companies
  companieses(where: CompaniesWhereInput, orderBy: CompaniesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Companies]!
  companiesesConnection(where: CompaniesWhereInput, orderBy: CompaniesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): CompaniesConnection!
  companyNetworkTypeLinks(where: CompanyNetworkTypeLinksWhereUniqueInput!): CompanyNetworkTypeLinks
  companyNetworkTypeLinkses(where: CompanyNetworkTypeLinksWhereInput, orderBy: CompanyNetworkTypeLinksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [CompanyNetworkTypeLinks]!
  companyNetworkTypeLinksesConnection(where: CompanyNetworkTypeLinksWhereInput, orderBy: CompanyNetworkTypeLinksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): CompanyNetworkTypeLinksConnection!
  companyTypes(where: CompanyTypesWhereUniqueInput!): CompanyTypes
  companyTypeses(where: CompanyTypesWhereInput, orderBy: CompanyTypesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [CompanyTypes]!
  companyTypesesConnection(where: CompanyTypesWhereInput, orderBy: CompanyTypesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): CompanyTypesConnection!
  deviceNetworkTypeLinks(where: DeviceNetworkTypeLinksWhereUniqueInput!): DeviceNetworkTypeLinks
  deviceNetworkTypeLinkses(where: DeviceNetworkTypeLinksWhereInput, orderBy: DeviceNetworkTypeLinksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [DeviceNetworkTypeLinks]!
  deviceNetworkTypeLinksesConnection(where: DeviceNetworkTypeLinksWhereInput, orderBy: DeviceNetworkTypeLinksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): DeviceNetworkTypeLinksConnection!
  deviceProfiles(where: DeviceProfilesWhereUniqueInput!): DeviceProfiles
  deviceProfileses(where: DeviceProfilesWhereInput, orderBy: DeviceProfilesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [DeviceProfiles]!
  deviceProfilesesConnection(where: DeviceProfilesWhereInput, orderBy: DeviceProfilesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): DeviceProfilesConnection!
  devices(where: DevicesWhereUniqueInput!): Devices
  deviceses(where: DevicesWhereInput, orderBy: DevicesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Devices]!
  devicesesConnection(where: DevicesWhereInput, orderBy: DevicesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): DevicesConnection!
  emailVerifications(where: EmailVerificationsWhereUniqueInput!): EmailVerifications
  emailVerificationses(where: EmailVerificationsWhereInput, orderBy: EmailVerificationsOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [EmailVerifications]!
  emailVerificationsesConnection(where: EmailVerificationsWhereInput, orderBy: EmailVerificationsOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): EmailVerificationsConnection!
  networkProtocols(where: NetworkProtocolsWhereUniqueInput!): NetworkProtocols
  networkProtocolses(where: NetworkProtocolsWhereInput, orderBy: NetworkProtocolsOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [NetworkProtocols]!
  networkProtocolsesConnection(where: NetworkProtocolsWhereInput, orderBy: NetworkProtocolsOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): NetworkProtocolsConnection!
  networkProviders(where: NetworkProvidersWhereUniqueInput!): NetworkProviders
  networkProviderses(where: NetworkProvidersWhereInput, orderBy: NetworkProvidersOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [NetworkProviders]!
  networkProvidersesConnection(where: NetworkProvidersWhereInput, orderBy: NetworkProvidersOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): NetworkProvidersConnection!
  networkTypes(where: NetworkTypesWhereUniqueInput!): NetworkTypes
  networkTypeses(where: NetworkTypesWhereInput, orderBy: NetworkTypesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [NetworkTypes]!
  networkTypesesConnection(where: NetworkTypesWhereInput, orderBy: NetworkTypesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): NetworkTypesConnection!
  networks(where: NetworksWhereUniqueInput!): Networks
  networkses(where: NetworksWhereInput, orderBy: NetworksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Networks]!
  networksesConnection(where: NetworksWhereInput, orderBy: NetworksOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): NetworksConnection!
  passwordPolicies(where: PasswordPoliciesWhereUniqueInput!): PasswordPolicies
  passwordPolicieses(where: PasswordPoliciesWhereInput, orderBy: PasswordPoliciesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [PasswordPolicies]!
  passwordPoliciesesConnection(where: PasswordPoliciesWhereInput, orderBy: PasswordPoliciesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): PasswordPoliciesConnection!
  protocolData(where: ProtocolDataWhereUniqueInput!): ProtocolData
  protocolDatas(where: ProtocolDataWhereInput, orderBy: ProtocolDataOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [ProtocolData]!
  protocolDatasConnection(where: ProtocolDataWhereInput, orderBy: ProtocolDataOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): ProtocolDataConnection!
  reportingProtocols(where: ReportingProtocolsWhereUniqueInput!): ReportingProtocols
  reportingProtocolses(where: ReportingProtocolsWhereInput, orderBy: ReportingProtocolsOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [ReportingProtocols]!
  reportingProtocolsesConnection(where: ReportingProtocolsWhereInput, orderBy: ReportingProtocolsOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): ReportingProtocolsConnection!
  userRoles(where: UserRolesWhereUniqueInput!): UserRoles
  userRoleses(where: UserRolesWhereInput, orderBy: UserRolesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [UserRoles]!
  userRolesesConnection(where: UserRolesWhereInput, orderBy: UserRolesOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): UserRolesConnection!
  users(where: UsersWhereUniqueInput!): Users
  userses(where: UsersWhereInput, orderBy: UsersOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Users]!
  usersesConnection(where: UsersWhereInput, orderBy: UsersOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): UsersConnection!
  node(id: ID!): Node
}

type ReportingProtocols {
  applicationses(where: ApplicationsWhereInput, orderBy: ApplicationsOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Applications!]
  id: Int!
  name: String
  protocolHandler: String
}

type ReportingProtocolsConnection {
  pageInfo: PageInfo!
  edges: [ReportingProtocolsEdge]!
  aggregate: AggregateReportingProtocols!
}

input ReportingProtocolsCreateInput {
  applicationses: ApplicationsCreateManyWithoutReportingProtocolInput
  name: String
  protocolHandler: String
}

input ReportingProtocolsCreateOneWithoutApplicationsesInput {
  create: ReportingProtocolsCreateWithoutApplicationsesInput
  connect: ReportingProtocolsWhereUniqueInput
}

input ReportingProtocolsCreateWithoutApplicationsesInput {
  name: String
  protocolHandler: String
}

type ReportingProtocolsEdge {
  node: ReportingProtocols!
  cursor: String!
}

enum ReportingProtocolsOrderByInput {
  id_ASC
  id_DESC
  name_ASC
  name_DESC
  protocolHandler_ASC
  protocolHandler_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type ReportingProtocolsPreviousValues {
  id: Int!
  name: String
  protocolHandler: String
}

type ReportingProtocolsSubscriptionPayload {
  mutation: MutationType!
  node: ReportingProtocols
  updatedFields: [String!]
  previousValues: ReportingProtocolsPreviousValues
}

input ReportingProtocolsSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: ReportingProtocolsWhereInput
  AND: [ReportingProtocolsSubscriptionWhereInput!]
  OR: [ReportingProtocolsSubscriptionWhereInput!]
  NOT: [ReportingProtocolsSubscriptionWhereInput!]
}

input ReportingProtocolsUpdateInput {
  applicationses: ApplicationsUpdateManyWithoutReportingProtocolInput
  name: String
  protocolHandler: String
}

input ReportingProtocolsUpdateManyMutationInput {
  name: String
  protocolHandler: String
}

input ReportingProtocolsUpdateOneWithoutApplicationsesInput {
  create: ReportingProtocolsCreateWithoutApplicationsesInput
  update: ReportingProtocolsUpdateWithoutApplicationsesDataInput
  upsert: ReportingProtocolsUpsertWithoutApplicationsesInput
  delete: Boolean
  disconnect: Boolean
  connect: ReportingProtocolsWhereUniqueInput
}

input ReportingProtocolsUpdateWithoutApplicationsesDataInput {
  name: String
  protocolHandler: String
}

input ReportingProtocolsUpsertWithoutApplicationsesInput {
  update: ReportingProtocolsUpdateWithoutApplicationsesDataInput!
  create: ReportingProtocolsCreateWithoutApplicationsesInput!
}

input ReportingProtocolsWhereInput {
  applicationses_every: ApplicationsWhereInput
  applicationses_some: ApplicationsWhereInput
  applicationses_none: ApplicationsWhereInput
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  protocolHandler: String
  protocolHandler_not: String
  protocolHandler_in: [String!]
  protocolHandler_not_in: [String!]
  protocolHandler_lt: String
  protocolHandler_lte: String
  protocolHandler_gt: String
  protocolHandler_gte: String
  protocolHandler_contains: String
  protocolHandler_not_contains: String
  protocolHandler_starts_with: String
  protocolHandler_not_starts_with: String
  protocolHandler_ends_with: String
  protocolHandler_not_ends_with: String
  AND: [ReportingProtocolsWhereInput!]
  OR: [ReportingProtocolsWhereInput!]
  NOT: [ReportingProtocolsWhereInput!]
}

input ReportingProtocolsWhereUniqueInput {
  id: Int
}

type Subscription {
  applicationNetworkTypeLinks(where: ApplicationNetworkTypeLinksSubscriptionWhereInput): ApplicationNetworkTypeLinksSubscriptionPayload
  applications(where: ApplicationsSubscriptionWhereInput): ApplicationsSubscriptionPayload
  companies(where: CompaniesSubscriptionWhereInput): CompaniesSubscriptionPayload
  companyNetworkTypeLinks(where: CompanyNetworkTypeLinksSubscriptionWhereInput): CompanyNetworkTypeLinksSubscriptionPayload
  companyTypes(where: CompanyTypesSubscriptionWhereInput): CompanyTypesSubscriptionPayload
  deviceNetworkTypeLinks(where: DeviceNetworkTypeLinksSubscriptionWhereInput): DeviceNetworkTypeLinksSubscriptionPayload
  deviceProfiles(where: DeviceProfilesSubscriptionWhereInput): DeviceProfilesSubscriptionPayload
  devices(where: DevicesSubscriptionWhereInput): DevicesSubscriptionPayload
  emailVerifications(where: EmailVerificationsSubscriptionWhereInput): EmailVerificationsSubscriptionPayload
  networkProtocols(where: NetworkProtocolsSubscriptionWhereInput): NetworkProtocolsSubscriptionPayload
  networkProviders(where: NetworkProvidersSubscriptionWhereInput): NetworkProvidersSubscriptionPayload
  networkTypes(where: NetworkTypesSubscriptionWhereInput): NetworkTypesSubscriptionPayload
  networks(where: NetworksSubscriptionWhereInput): NetworksSubscriptionPayload
  passwordPolicies(where: PasswordPoliciesSubscriptionWhereInput): PasswordPoliciesSubscriptionPayload
  protocolData(where: ProtocolDataSubscriptionWhereInput): ProtocolDataSubscriptionPayload
  reportingProtocols(where: ReportingProtocolsSubscriptionWhereInput): ReportingProtocolsSubscriptionPayload
  userRoles(where: UserRolesSubscriptionWhereInput): UserRolesSubscriptionPayload
  users(where: UsersSubscriptionWhereInput): UsersSubscriptionPayload
}

type UserRoles {
  id: Int!
  name: String
  userses(where: UsersWhereInput, orderBy: UsersOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Users!]
}

type UserRolesConnection {
  pageInfo: PageInfo!
  edges: [UserRolesEdge]!
  aggregate: AggregateUserRoles!
}

input UserRolesCreateInput {
  name: String
  userses: UsersCreateManyWithoutRoleInput
}

input UserRolesCreateOneWithoutUsersesInput {
  create: UserRolesCreateWithoutUsersesInput
  connect: UserRolesWhereUniqueInput
}

input UserRolesCreateWithoutUsersesInput {
  name: String
}

type UserRolesEdge {
  node: UserRoles!
  cursor: String!
}

enum UserRolesOrderByInput {
  id_ASC
  id_DESC
  name_ASC
  name_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type UserRolesPreviousValues {
  id: Int!
  name: String
}

type UserRolesSubscriptionPayload {
  mutation: MutationType!
  node: UserRoles
  updatedFields: [String!]
  previousValues: UserRolesPreviousValues
}

input UserRolesSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: UserRolesWhereInput
  AND: [UserRolesSubscriptionWhereInput!]
  OR: [UserRolesSubscriptionWhereInput!]
  NOT: [UserRolesSubscriptionWhereInput!]
}

input UserRolesUpdateInput {
  name: String
  userses: UsersUpdateManyWithoutRoleInput
}

input UserRolesUpdateManyMutationInput {
  name: String
}

input UserRolesUpdateOneWithoutUsersesInput {
  create: UserRolesCreateWithoutUsersesInput
  update: UserRolesUpdateWithoutUsersesDataInput
  upsert: UserRolesUpsertWithoutUsersesInput
  delete: Boolean
  disconnect: Boolean
  connect: UserRolesWhereUniqueInput
}

input UserRolesUpdateWithoutUsersesDataInput {
  name: String
}

input UserRolesUpsertWithoutUsersesInput {
  update: UserRolesUpdateWithoutUsersesDataInput!
  create: UserRolesCreateWithoutUsersesInput!
}

input UserRolesWhereInput {
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  userses_every: UsersWhereInput
  userses_some: UsersWhereInput
  userses_none: UsersWhereInput
  AND: [UserRolesWhereInput!]
  OR: [UserRolesWhereInput!]
  NOT: [UserRolesWhereInput!]
}

input UserRolesWhereUniqueInput {
  id: Int
}

type Users {
  company: Companies
  email: String
  emailVerificationses(where: EmailVerificationsWhereInput, orderBy: EmailVerificationsOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [EmailVerifications!]
  emailVerified: Boolean
  id: Int!
  lastVerifiedEmail: String
  passwordHash: String
  role: UserRoles
  username: String
}

type UsersConnection {
  pageInfo: PageInfo!
  edges: [UsersEdge]!
  aggregate: AggregateUsers!
}

input UsersCreateInput {
  company: CompaniesCreateOneWithoutUsersesInput
  email: String
  emailVerificationses: EmailVerificationsCreateManyWithoutUserInput
  emailVerified: Boolean
  lastVerifiedEmail: String
  passwordHash: String
  role: UserRolesCreateOneWithoutUsersesInput
  username: String
}

input UsersCreateManyWithoutCompanyInput {
  create: [UsersCreateWithoutCompanyInput!]
  connect: [UsersWhereUniqueInput!]
}

input UsersCreateManyWithoutRoleInput {
  create: [UsersCreateWithoutRoleInput!]
  connect: [UsersWhereUniqueInput!]
}

input UsersCreateOneWithoutEmailVerificationsesInput {
  create: UsersCreateWithoutEmailVerificationsesInput
  connect: UsersWhereUniqueInput
}

input UsersCreateWithoutCompanyInput {
  email: String
  emailVerificationses: EmailVerificationsCreateManyWithoutUserInput
  emailVerified: Boolean
  lastVerifiedEmail: String
  passwordHash: String
  role: UserRolesCreateOneWithoutUsersesInput
  username: String
}

input UsersCreateWithoutEmailVerificationsesInput {
  company: CompaniesCreateOneWithoutUsersesInput
  email: String
  emailVerified: Boolean
  lastVerifiedEmail: String
  passwordHash: String
  role: UserRolesCreateOneWithoutUsersesInput
  username: String
}

input UsersCreateWithoutRoleInput {
  company: CompaniesCreateOneWithoutUsersesInput
  email: String
  emailVerificationses: EmailVerificationsCreateManyWithoutUserInput
  emailVerified: Boolean
  lastVerifiedEmail: String
  passwordHash: String
  username: String
}

type UsersEdge {
  node: Users!
  cursor: String!
}

enum UsersOrderByInput {
  email_ASC
  email_DESC
  emailVerified_ASC
  emailVerified_DESC
  id_ASC
  id_DESC
  lastVerifiedEmail_ASC
  lastVerifiedEmail_DESC
  passwordHash_ASC
  passwordHash_DESC
  username_ASC
  username_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type UsersPreviousValues {
  email: String
  emailVerified: Boolean
  id: Int!
  lastVerifiedEmail: String
  passwordHash: String
  username: String
}

input UsersScalarWhereInput {
  email: String
  email_not: String
  email_in: [String!]
  email_not_in: [String!]
  email_lt: String
  email_lte: String
  email_gt: String
  email_gte: String
  email_contains: String
  email_not_contains: String
  email_starts_with: String
  email_not_starts_with: String
  email_ends_with: String
  email_not_ends_with: String
  emailVerified: Boolean
  emailVerified_not: Boolean
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  lastVerifiedEmail: String
  lastVerifiedEmail_not: String
  lastVerifiedEmail_in: [String!]
  lastVerifiedEmail_not_in: [String!]
  lastVerifiedEmail_lt: String
  lastVerifiedEmail_lte: String
  lastVerifiedEmail_gt: String
  lastVerifiedEmail_gte: String
  lastVerifiedEmail_contains: String
  lastVerifiedEmail_not_contains: String
  lastVerifiedEmail_starts_with: String
  lastVerifiedEmail_not_starts_with: String
  lastVerifiedEmail_ends_with: String
  lastVerifiedEmail_not_ends_with: String
  passwordHash: String
  passwordHash_not: String
  passwordHash_in: [String!]
  passwordHash_not_in: [String!]
  passwordHash_lt: String
  passwordHash_lte: String
  passwordHash_gt: String
  passwordHash_gte: String
  passwordHash_contains: String
  passwordHash_not_contains: String
  passwordHash_starts_with: String
  passwordHash_not_starts_with: String
  passwordHash_ends_with: String
  passwordHash_not_ends_with: String
  username: String
  username_not: String
  username_in: [String!]
  username_not_in: [String!]
  username_lt: String
  username_lte: String
  username_gt: String
  username_gte: String
  username_contains: String
  username_not_contains: String
  username_starts_with: String
  username_not_starts_with: String
  username_ends_with: String
  username_not_ends_with: String
  AND: [UsersScalarWhereInput!]
  OR: [UsersScalarWhereInput!]
  NOT: [UsersScalarWhereInput!]
}

type UsersSubscriptionPayload {
  mutation: MutationType!
  node: Users
  updatedFields: [String!]
  previousValues: UsersPreviousValues
}

input UsersSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: UsersWhereInput
  AND: [UsersSubscriptionWhereInput!]
  OR: [UsersSubscriptionWhereInput!]
  NOT: [UsersSubscriptionWhereInput!]
}

input UsersUpdateInput {
  company: CompaniesUpdateOneWithoutUsersesInput
  email: String
  emailVerificationses: EmailVerificationsUpdateManyWithoutUserInput
  emailVerified: Boolean
  lastVerifiedEmail: String
  passwordHash: String
  role: UserRolesUpdateOneWithoutUsersesInput
  username: String
}

input UsersUpdateManyDataInput {
  email: String
  emailVerified: Boolean
  lastVerifiedEmail: String
  passwordHash: String
  username: String
}

input UsersUpdateManyMutationInput {
  email: String
  emailVerified: Boolean
  lastVerifiedEmail: String
  passwordHash: String
  username: String
}

input UsersUpdateManyWithoutCompanyInput {
  create: [UsersCreateWithoutCompanyInput!]
  delete: [UsersWhereUniqueInput!]
  connect: [UsersWhereUniqueInput!]
  disconnect: [UsersWhereUniqueInput!]
  update: [UsersUpdateWithWhereUniqueWithoutCompanyInput!]
  upsert: [UsersUpsertWithWhereUniqueWithoutCompanyInput!]
  deleteMany: [UsersScalarWhereInput!]
  updateMany: [UsersUpdateManyWithWhereNestedInput!]
}

input UsersUpdateManyWithoutRoleInput {
  create: [UsersCreateWithoutRoleInput!]
  delete: [UsersWhereUniqueInput!]
  connect: [UsersWhereUniqueInput!]
  disconnect: [UsersWhereUniqueInput!]
  update: [UsersUpdateWithWhereUniqueWithoutRoleInput!]
  upsert: [UsersUpsertWithWhereUniqueWithoutRoleInput!]
  deleteMany: [UsersScalarWhereInput!]
  updateMany: [UsersUpdateManyWithWhereNestedInput!]
}

input UsersUpdateManyWithWhereNestedInput {
  where: UsersScalarWhereInput!
  data: UsersUpdateManyDataInput!
}

input UsersUpdateOneWithoutEmailVerificationsesInput {
  create: UsersCreateWithoutEmailVerificationsesInput
  update: UsersUpdateWithoutEmailVerificationsesDataInput
  upsert: UsersUpsertWithoutEmailVerificationsesInput
  delete: Boolean
  disconnect: Boolean
  connect: UsersWhereUniqueInput
}

input UsersUpdateWithoutCompanyDataInput {
  email: String
  emailVerificationses: EmailVerificationsUpdateManyWithoutUserInput
  emailVerified: Boolean
  lastVerifiedEmail: String
  passwordHash: String
  role: UserRolesUpdateOneWithoutUsersesInput
  username: String
}

input UsersUpdateWithoutEmailVerificationsesDataInput {
  company: CompaniesUpdateOneWithoutUsersesInput
  email: String
  emailVerified: Boolean
  lastVerifiedEmail: String
  passwordHash: String
  role: UserRolesUpdateOneWithoutUsersesInput
  username: String
}

input UsersUpdateWithoutRoleDataInput {
  company: CompaniesUpdateOneWithoutUsersesInput
  email: String
  emailVerificationses: EmailVerificationsUpdateManyWithoutUserInput
  emailVerified: Boolean
  lastVerifiedEmail: String
  passwordHash: String
  username: String
}

input UsersUpdateWithWhereUniqueWithoutCompanyInput {
  where: UsersWhereUniqueInput!
  data: UsersUpdateWithoutCompanyDataInput!
}

input UsersUpdateWithWhereUniqueWithoutRoleInput {
  where: UsersWhereUniqueInput!
  data: UsersUpdateWithoutRoleDataInput!
}

input UsersUpsertWithoutEmailVerificationsesInput {
  update: UsersUpdateWithoutEmailVerificationsesDataInput!
  create: UsersCreateWithoutEmailVerificationsesInput!
}

input UsersUpsertWithWhereUniqueWithoutCompanyInput {
  where: UsersWhereUniqueInput!
  update: UsersUpdateWithoutCompanyDataInput!
  create: UsersCreateWithoutCompanyInput!
}

input UsersUpsertWithWhereUniqueWithoutRoleInput {
  where: UsersWhereUniqueInput!
  update: UsersUpdateWithoutRoleDataInput!
  create: UsersCreateWithoutRoleInput!
}

input UsersWhereInput {
  company: CompaniesWhereInput
  email: String
  email_not: String
  email_in: [String!]
  email_not_in: [String!]
  email_lt: String
  email_lte: String
  email_gt: String
  email_gte: String
  email_contains: String
  email_not_contains: String
  email_starts_with: String
  email_not_starts_with: String
  email_ends_with: String
  email_not_ends_with: String
  emailVerificationses_every: EmailVerificationsWhereInput
  emailVerificationses_some: EmailVerificationsWhereInput
  emailVerificationses_none: EmailVerificationsWhereInput
  emailVerified: Boolean
  emailVerified_not: Boolean
  id: Int
  id_not: Int
  id_in: [Int!]
  id_not_in: [Int!]
  id_lt: Int
  id_lte: Int
  id_gt: Int
  id_gte: Int
  lastVerifiedEmail: String
  lastVerifiedEmail_not: String
  lastVerifiedEmail_in: [String!]
  lastVerifiedEmail_not_in: [String!]
  lastVerifiedEmail_lt: String
  lastVerifiedEmail_lte: String
  lastVerifiedEmail_gt: String
  lastVerifiedEmail_gte: String
  lastVerifiedEmail_contains: String
  lastVerifiedEmail_not_contains: String
  lastVerifiedEmail_starts_with: String
  lastVerifiedEmail_not_starts_with: String
  lastVerifiedEmail_ends_with: String
  lastVerifiedEmail_not_ends_with: String
  passwordHash: String
  passwordHash_not: String
  passwordHash_in: [String!]
  passwordHash_not_in: [String!]
  passwordHash_lt: String
  passwordHash_lte: String
  passwordHash_gt: String
  passwordHash_gte: String
  passwordHash_contains: String
  passwordHash_not_contains: String
  passwordHash_starts_with: String
  passwordHash_not_starts_with: String
  passwordHash_ends_with: String
  passwordHash_not_ends_with: String
  role: UserRolesWhereInput
  username: String
  username_not: String
  username_in: [String!]
  username_not_in: [String!]
  username_lt: String
  username_lte: String
  username_gt: String
  username_gte: String
  username_contains: String
  username_not_contains: String
  username_starts_with: String
  username_not_starts_with: String
  username_ends_with: String
  username_not_ends_with: String
  AND: [UsersWhereInput!]
  OR: [UsersWhereInput!]
  NOT: [UsersWhereInput!]
}

input UsersWhereUniqueInput {
  id: Int
}
`
      }
    