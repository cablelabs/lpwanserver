-- Converts pre-migration manage database to first migration format.
-- "Pre-migration" format can be recognized by a lack of record ids.

--
-- Companies table - simplify field names, add integer primary key, change
-- types to numeric value, add compny type table to have names.
--
CREATE TABLE IF NOT EXISTS companyTypes (
    type INTEGER PRIMARY KEY, /* 1 = admin, 2 = vendor, 3 = operator, 4 = devicemfg */
    name TEXT UNIQUE COLLATE NOCASE
);

insert into companyTypes (name, type)
    values ('admin', 1), ('vendor', 2), ('operator', 3), ('devicemfg', 4);

CREATE TABLE IF NOT EXISTS companiesnew (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE COLLATE NOCASE,
    type INT    /* 1 = admin, 2 = vendor, 3 = operator, 4 = devicemfg */
);

insert into companiesnew (name, type)
    select c.companyName as name, t.type as type
              from companies c, companyTypes t
              where c.companyType = t.name;

alter table companies rename to companiesOld;
alter table companiesnew rename to companies;


--
-- passwordPolicies table - change key to company from name to record id.
--
create table if not exists passwordPoliciesNew (
    id INTEGER PRIMARY KEY,
    ruleText TEXT,
    ruleRegExp TEXT,
    companyId INTEGER NOT NULL,
    FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

insert into passwordPoliciesNew (id, ruleText, ruleRegExp, companyId )
    select pp.id as id, pp.ruleText as ruleText, pp.ruleRegExp as ruleRegExp,
           c.id as companyId from passwordPolicies pp, companies c
           where pp.companyName = c.name;

-- Make sure we get the ones with no company - they are global rules.
insert into passwordPoliciesNew (id, ruleText, ruleRegExp, companyId )
   select id, ruleText, ruleRegExp, null as companyId
              from passwordPolicies
              where companyName = null;

alter table passwordPolicies rename to passwordPoliciesOld;
alter table passwordPoliciesNew rename to passwordPolicies;

--
-- Users table - use company id rather than company name, and add a user role
-- definition table.
--
CREATE TABLE IF NOT EXISTS userRoles (
    roleId INTEGER PRIMARY KEY, /* 1 = user, 2 = admin */
    name TEXT UNIQUE COLLATE NOCASE
);

insert into userRoles (roleId, name)
    values (1, 'user'), (2, 'admin');

CREATE TABLE IF NOT EXISTS usersNew (
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

insert into usersNew ( username, email, lastVerifiedEmail, emailVerified, companyId, passwordHash, role )
    select u.username as username, u.email as email,
           u.lastVerifiedEmail as lastVerifiedEmail,
           u.emailVerified as emailVerified, c.id as companyId,
           u.passwordHash as passwordHash, u.role as role
           from users u, companies c
           where u.companyName = c.name;

alter table users rename to usersOld;
alter table usersNew rename to users;

CREATE TABLE IF NOT EXISTS emailVerifications (
    id INTEGER PRIMARY KEY,
    userId INTEGER NOT NULL,
    uuid TEXT UNIQUE  COLLATE NOCASE,
    email TEXT  COLLATE NOCASE,
    changeRequested TEXT COLLATE NOCASE,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
);

insert into emailVerifications ( userId, uuid, email, changeRequested )
    select u.id as userId,
        e.uuid as uuid,
        e.email as email,
        e.changeRequested as changeRequested
        from users u, emailVerify e
        where u.username = e.username;

alter table emailVerify rename to emailVerifyOld;

CREATE TABLE applicationsNew (
        applicationID TEXT UNIQUE COLLATE NOCASE,
        applicationName TEXT COLLATE NOCASE,
        applicationVendor TEXT COLLATE NOCASE,
        interfaceType TEXT, /* POST, WS, etc */
        interfaceURL TEXT,
        FOREIGN KEY(applicationVendor) REFERENCES companies(name) ON DELETE CASCADE);

insert into applicationsNew ( applicationID, applicationName, applicationVendor, interfaceType, interfaceURL ) select * from applications;

alter table applications rename to applicationsOldIndex;
alter table applicationsNew rename to applications;


-- ****************************************************************
-- Part 2
-- *****************************************************************

create table if not exists networkProtocols (
    id INTEGER PRIMARY KEY,
    name TEXT,
    protocolType TEXT,
    protocolHandler TEXT
);

insert into networkProtocols (id, name, protocolType, protocolHandler )
    values( 1, "Open Source LoRa", "LoRa", "OpenSourceLora.js" );

create table if not exists provisioningTables (
    id INTEGER PRIMARY KEY,
    type TEXT
);
insert into provisioningTables ( id, type )
    values ( 1, 'companies' ), ( 2, 'applications' ), ( 3, 'devices' );

create table if not exists networkProvisioningFields (
    id INTEGER PRIMARY KEY,
    networkProtocolId INTEGER REFERENCES networkProtocols( id ) NOT NULL,
    fieldOrder INTEGER,
    fieldName TEXT,
    fieldLabel TEXT,
    fieldType TEXT,
    fieldSize INTEGER,
    requiredField BOOLEAN,
    provisioningTableId INTEGER REFERENCES provisioningTables( id ) NOT NULL
);

insert into networkProvisioningFields( id, networkProtocolId, fieldOrder, fieldName, fieldLabel, fieldType, fieldSize, requiredField, provisioningTableId )
    values
    ( 1, 1, 1, "orgName", "Organization Name", "string", null, 1, 1 ),
    ( 2, 1, 1, "appEUI", "Application EUI", "hexstring", 16, 1, 2 ),
    ( 3, 1, 1, "devEUI", "Device EUI", "hexstring", 16, 0, 3 ),
    ( 4, 1, 2, "macAddress", "LoRa MAC Address", "hexstring", 16, 0, 3 ),
    ( 5, 1, 3, "appKey", "Application Key", "hexstring", 32, 0, 3 );

create table if not exists networks (
    id INTEGER PRIMARY KEY,
    name TEXT,
    networkProtocolId INTEGER REFERENCES networkProtocols( id ) NOT NULL,
    baseUrl TEXT,
    securityData TEXT
);
insert into networks ( id, networkProtocolId, baseUrl, securityData )
              values ( 1, 1, "https://lora.cablelabs.com:4200/api", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiamNhbXBhbmVsbCIsImlhdCI6MTUwNTIzNzMzNSwiZXhwIjoxNTA1MjgwNTM1LCJpc3MiOiJscHdhbCJ9.daJbZwuN8x1jkpDKNpuM-K_jCx0DVqzlIYHMK5M512Q" );

create table if not exists companyNetworkLinks (
    id INTEGER PRIMARY KEY,
    companyId INTEGER REFERENCES companies( id ) ON DELETE CASCADE NOT NULL,
    networkId INTEGER REFERENCES networks( id ) ON DELETE CASCADE NOT NULL,
    networkSettings TEXT,
    lastPush TEXT,
    UNIQUE( companyId, networkId )
);

insert into companyNetworkLinks ( companyId, networkId, networkSettings )
    select id as companyId,
           1 as networkId,
           '{ "orgName": "' || name || '"}' as networkSettings
           from companies;


create table if not exists reportingProtocols (
    id INTEGER PRIMARY KEY,
    name TEXT,
    protocolHandler TEXT
);

create table if not exists applicationsNew (
    id INTEGER PRIMARY KEY,
    companyId INTEGER,
    name TEXT,
    baseURL TEXT,
    reportingProtocolId INTEGER,
    FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY(reportingProtocolId) REFERENCES reportingProtocols(id)
);

insert into reportingProtocols ( name, protocolHandler ) values( "POST", "postHandler" );

insert into applicationsNew ( companyId, name, baseURL, reportingProtocolId )
    select c.id as companyId, a.applicationName as name, a.interfaceURL as baseURL, r.id as reportingProtocolId
        from companies c, applications a, reportingProtocols r
        where c.name = a.applicationVendor and r.name = a.interfaceType;

alter table applications rename to applicationsOld;
alter table applicationsnew rename to applications;

create table if not exists applicationNetworkLinks (
    id INTEGER PRIMARY KEY,
    applicationId INTEGER REFERENCES applications( id ) ON DELETE CASCADE NOT NULL,
    networkId INTEGER REFERENCES networks( id ) ON DELETE CASCADE NOT NULL,
    networkSettings TEXT,
    lastPush TEXT,
    UNIQUE( applicationId, networkId )
);

insert into applicationNetworkLinks ( applicationId, networkId, networkSettings )
    select a.id as applicationId,
           1 as networkId,
           '{ "appEUI": "' || a2.applicationID || '"}' as networkSettings
           from applications a, applicationsOld a2
           where a.name = a2.applicationName;

create table if not exists devicesNew (
    id INTEGER PRIMARY KEY,
    applicationId INTEGER references applications( id ) ON DELETE CASCADE NOT NULL,
    name TEXT,
    deviceModel TEXT
);

insert into devicesNew ( applicationId, name, deviceModel )
    select anl.id as applicationId, d.deviceEUI as name, d.model as deviceModel
        from applicationNetworkLinks anl, devices d
        where anl.networkSettings like '%' || d.applicationID || '%';

alter table devices rename to devicesOld;
alter table devicesNew rename to devices;

create table if not exists deviceNetworkLinks (
    id INTEGER PRIMARY KEY,
    deviceId INTEGER REFERENCES devices( id ) ON DELETE CASCADE NOT NULL,
    networkId INTEGER REFERENCES networks( id ) ON DELETE CASCADE NOT NULL,
    networkSettings TEXT,
    lastPush TEXT,
    UNIQUE( deviceId, networkId )
);

insert into deviceNetworkLinks ( deviceId, networkId, networkSettings )
    select d.id as applicationId,
           1 as networkId,
           '{ "devEUI": "' || d.name || '", "appKey": "' || d2.appKey || '"}' as networkSettings
           from devices d, devicesOld d2
           where d.name = d2.deviceEUI;
