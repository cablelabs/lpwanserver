"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_lib_1 = require("prisma-client-lib");
var typeDefs = require("./prisma-schema").typeDefs;

var models = [
  {
    name: "DeviceNetworkTypeLink",
    embedded: false
  },
  {
    name: "Application",
    embedded: false
  },
  {
    name: "Company",
    embedded: false
  },
  {
    name: "User",
    embedded: false
  },
  {
    name: "NetworkType",
    embedded: false
  },
  {
    name: "ApplicationNetworkTypeLink",
    embedded: false
  },
  {
    name: "ReportingProtocol",
    embedded: false
  },
  {
    name: "ProtocolData",
    embedded: false
  },
  {
    name: "UserRole",
    embedded: false
  },
  {
    name: "Network",
    embedded: false
  },
  {
    name: "PasswordPolicy",
    embedded: false
  },
  {
    name: "NetworkProtocol",
    embedded: false
  },
  {
    name: "NetworkProvider",
    embedded: false
  },
  {
    name: "Device",
    embedded: false
  },
  {
    name: "DeviceProfile",
    embedded: false
  },
  {
    name: "CompanyNetworkTypeLink",
    embedded: false
  },
  {
    name: "CompanyType",
    embedded: false
  },
  {
    name: "EmailVerification",
    embedded: false
  }
];
exports.Prisma = prisma_lib_1.makePrismaClientClass({
  typeDefs,
  models,
  endpoint: `http://localhost:4466`
});
exports.prisma = new exports.Prisma();
