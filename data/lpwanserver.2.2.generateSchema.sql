-- Version 2.1 LPWAN Server database
-- Set up the database schema -- No Data!
--
CREATE TABLE IF NOT EXISTS companyTypes (
    type INTEGER PRIMARY KEY,
    name TEXT UNIQUE COLLATE NOCASE
);

CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE COLLATE NOCASE,
    type INT REFERENCES companyTypes( type )
);

CREATE TABLE IF NOT EXISTS passwordPolicies (
    id INTEGER PRIMARY KEY,
    ruleText TEXT,
    ruleRegExp TEXT,
    companyId INTEGER,
    FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS userRoles (
    roleId INTEGER PRIMARY KEY,
    name TEXT UNIQUE COLLATE NOCASE
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE  COLLATE NOCASE,
    email TEXT  COLLATE NOCASE,
    lastVerifiedEmail TEXT  COLLATE NOCASE,
    emailVerified BOOLEAN DEFAULT 0,
    companyId INTEGER NOT NULL,
    passwordHash TEXT,
    role INTEGER DEFAULT 0,
    FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY(role) REFERENCES userRoles(roleId)
);

CREATE TABLE IF NOT EXISTS emailVerifications (
    id INTEGER PRIMARY KEY,
    userId INTEGER NOT NULL,
    uuid TEXT UNIQUE  COLLATE NOCASE,
    email TEXT  COLLATE NOCASE,
    changeRequested TEXT COLLATE NOCASE,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS networkTypes (
    id INTEGER PRIMARY KEY,
    name TEXT
);

CREATE TABLE IF NOT EXISTS networkProviders (
    id INTEGER PRIMARY KEY,
    name TEXT
);

CREATE TABLE IF NOT EXISTS networkProtocols
(
  id              INTEGER primary key,
  name            TEXT,
  protocolHandler TEXT,
  networkTypeId   INTEGER not null references networkTypes,
  networkProtocolVersion         TEXT,
  masterProtocol  int default null constraint masterProtocol_fk references networkProtocols37ac (id) on delete set null
);

CREATE TABLE IF NOT EXISTS networks (
    id INTEGER PRIMARY KEY,
    name TEXT,
    networkProviderId INTEGER REFERENCES networkProviders( id ) NOT NULL,
    networkTypeId INTEGER REFERENCES networkTypes( id ) NOT NULL,
    networkProtocolId INTEGER REFERENCES networkProtocols( id ) NOT NULL,
    baseUrl TEXT,
    securityData TEXT
);

CREATE TABLE IF NOT EXISTS companyNetworkTypeLinks (
    id INTEGER PRIMARY KEY,
    companyId INTEGER REFERENCES companies( id ) ON DELETE CASCADE NOT NULL,
    networkTypeId INTEGER REFERENCES networkTypes( id ) ON DELETE CASCADE NOT NULL,
    networkSettings TEXT,
    UNIQUE( companyId, networkTypeId )
);

CREATE TABLE IF NOT EXISTS reportingProtocols (
    id INTEGER PRIMARY KEY,
    name TEXT,
    protocolHandler TEXT
);

CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY,
    companyId INTEGER,
    name TEXT,
    description TEXT,
    baseUrl TEXT,
    reportingProtocolId INTEGER,
    FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY(reportingProtocolId) REFERENCES reportingProtocols(id)
);

CREATE TABLE IF NOT EXISTS applicationNetworkTypeLinks (
    id INTEGER PRIMARY KEY,
    applicationId INTEGER REFERENCES applications( id ) ON DELETE CASCADE NOT NULL,
    networkTypeId INTEGER REFERENCES networkTypes( id ) ON DELETE CASCADE NOT NULL,
    networkSettings TEXT,
    UNIQUE( applicationId, networkTypeId )
);

CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY,
    applicationId INTEGER references applications( id ) ON DELETE CASCADE NOT NULL,
    name TEXT,
    description TEXT,
    deviceModel TEXT
);

CREATE TABLE IF NOT EXISTS deviceProfiles (
    id INTEGER PRIMARY KEY,
    networkTypeId INTEGER REFERENCES networkTypes( id ) ON DELETE CASCADE NOT NULL,
    companyId INTEGER REFERENCES companies( id ) ON DELETE CASCADE NOT NULL,
    name TEXT,
    description TEXT,
    networkSettings TEXT
);

CREATE TABLE IF NOT EXISTS deviceNetworkTypeLinks (
    id INTEGER PRIMARY KEY,
    deviceId INTEGER REFERENCES devices( id ) ON DELETE CASCADE NOT NULL,
    networkTypeId INTEGER REFERENCES networkTypes( id ) ON DELETE CASCADE NOT NULL,
    deviceProfileId INTEGER REFERENCES deviceProfiles( id ) NOT NULL,
    networkSettings TEXT,
    UNIQUE( deviceId, networkTypeId )
);

CREATE TABLE IF NOT EXISTS protocolData (
    id INTEGER PRIMARY KEY,
    networkId INTEGER REFERENCES networks( id ) ON DELETE CASCADE NOT NULL,
    networkProtocolId INTEGER REFERENCES networkProtocols( id ) ON DELETE CASCADE NOT NULL,
    dataIdentifier TEXT,
    dataValue TEXT
);
create index if not exists protocolData_dataIdentifier_index on protocolData( dataIdentifier );
