CREATE TABLE IF NOT EXISTS companies (
    companyName TEXT UNIQUE COLLATE NOCASE,
    companyType TEXT    /* vendor, operator, devicemfg */
);

CREATE TABLE IF NOT EXISTS users (
    username TEXT UNIQUE  COLLATE NOCASE,
    email TEXT  COLLATE NOCASE,
    lastVerifiedEmail TEXT  COLLATE NOCASE,
    emailVerified BOOLEAN DEFAULT 0,
    companyName TEXT  COLLATE NOCASE,
    passwordHash TEXT,
    role INTEGER DEFAULT 0,
    FOREIGN KEY(companyName) REFERENCES companies(companyName) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS emailVerify (
    uuid TEXT UNIQUE  COLLATE NOCASE,
    username TEXT  COLLATE NOCASE,
    email TEXT  COLLATE NOCASE,
    changeRequested TEXT COLLATE NOCASE,
    FOREIGN KEY(username) REFERENCES users(username) ON DELETE CASCADE
);

-- Note: Password Policies are valid for the named company, or ALL companies
--       when the companyName is NULL.
CREATE TABLE IF NOT EXISTS passwordPolicies (
    id INTEGER PRIMARY KEY,
    ruleText TEXT  COLLATE NOCASE,
    ruleRegExp TEXT  COLLATE NOCASE,
    companyName TEXT  COLLATE NOCASE,
    FOREIGN KEY(companyName) REFERENCES companies(companyName) ON DELETE CASCADE
);

-- The default password rule for everyone.
insert into passwordPolicies (id, ruleText, ruleRegExp)
    select 1, "Must be at least 6 characters long", "^\S{6,}$"
    where not exists( select 1 from passwordPolicies where id = 1 );


CREATE TABLE IF NOT EXISTS applications (
    applicationID TEXT UNIQUE COLLATE NOCASE,
    applicationName TEXT  COLLATE NOCASE,
    applicationVendor TEXT  COLLATE NOCASE,
    interfaceType TEXT, /* POST, WS, etc */
    interfaceURL TEXT,
    FOREIGN KEY(applicationVendor) REFERENCES companies(companyName) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lpwanInterfaces (
    applicationID TEXT,
    provider TEXT,  /* Senet, Loriot, etc */
    lpwanAppId TEXT,
    interfaceID TEXT UNIQUE,
    nsmUrl TEXT,
    nsmKey TEXT,
    FOREIGN KEY(applicationID) REFERENCES applications(applicationID)
);

CREATE TABLE IF NOT EXISTS devices (
    applicationID TEXT  COLLATE NOCASE,
    deviceEUI TEXT UNIQUE,
    model TEXT,
    appKey TEXT,
    FOREIGN KEY(applicationID) REFERENCES applications(applicationID)
);

CREATE TABLE IF NOT EXISTS lpwanLog (
    time TEXT,
    host TEXT,
    id TEXT,
    msgs INTEGER,
    bytes INTEGER
);

CREATE TABLE IF NOT EXISTS applicationLog (
    time TEXT,
    id TEXT,
    msgs INTEGER,
    bytes INTEGER
);

/* Foreign keys are turned off by default. They must be turned on for each database connection */
PRAGMA foreign_keys = ON;
