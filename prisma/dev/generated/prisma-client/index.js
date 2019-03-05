"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_lib_1 = require("prisma-client-lib");
var typeDefs = require("./prisma-schema").typeDefs;

var models = [
  {
    name: "ApplicationNetworkTypeLinks",
    embedded: false
  },
  {
    name: "Applications",
    embedded: false
  },
  {
    name: "Companies",
    embedded: false
  },
  {
    name: "CompanyNetworkTypeLinks",
    embedded: false
  },
  {
    name: "CompanyTypes",
    embedded: false
  },
  {
    name: "DeviceNetworkTypeLinks",
    embedded: false
  },
  {
    name: "DeviceProfiles",
    embedded: false
  },
  {
    name: "Devices",
    embedded: false
  },
  {
    name: "EmailVerifications",
    embedded: false
  },
  {
    name: "NetworkProtocols",
    embedded: false
  },
  {
    name: "NetworkProviders",
    embedded: false
  },
  {
    name: "NetworkTypes",
    embedded: false
  },
  {
    name: "Networks",
    embedded: false
  },
  {
    name: "PasswordPolicies",
    embedded: false
  },
  {
    name: "ProtocolData",
    embedded: false
  },
  {
    name: "ReportingProtocols",
    embedded: false
  },
  {
    name: "UserRoles",
    embedded: false
  },
  {
    name: "Users",
    embedded: false
  }
];
exports.Prisma = prisma_lib_1.makePrismaClientClass({
  typeDefs,
  models,
  endpoint: `http://localhost:4466`
});
exports.prisma = new exports.Prisma();
