-- Version 2.1 LPWAN Server database
-- Initialize the database data
--
-- Include primary keys so that if this is run multiple times, we don't just
-- start adding the same record(s) over and over.

-- Company types
insert into companyTypes (name, type)
    values ('admin', 1), ('vendor', 2);

-- User roles
INSERT INTO userRoles (roleId, name)
    values (1, 'user'), (2, 'admin');

-- Set up a default admin company
INSERT INTO companies ( id, name, type )
    values ( 1, 'SysAdmins', 1 );

-- Set up a default password rule for all companies
INSERT INTO passwordPolicies ( id, ruleText, ruleRegExp )
    values ( 1, 'Must be at least 6 characters long', '^\S{6,}$' );

-- Add a default global admin account.  Username: Admin, password: password
-- Email will be fake, but marked as not verified (Admin users MUST have an
-- email, but we do not know what to use yet).
INSERT INTO users ( id, username, email, companyId, passwordHash, role )
    values( 1, 'admin', 'admin@fakeco.co', 1, '000000100000003238bd33bdf92cfc3a8e7847e377e51ff8a3689913919b39d7dd0fe77c89610ce2947ab0b43a36895510d7d1f2924d84ab', 2 );

-- Start with the LoRa network type.
INSERT INTO networkTypes ( id, name )
    values( 1, 'LoRa' );

-- Start with the LoRa networkProtocol.
INSERT INTO networkProtocols ( id, name, protocolHandler, networkTypeId )
    values( 1, 'LoRa Server', 'LoRaOpenSource.js', 1 );

-- Start with the POST reportingProtocol.
INSERT INTO reportingProtocols ( id, name, protocolHandler )
    values( 1, 'POST', 'postHandler' );
