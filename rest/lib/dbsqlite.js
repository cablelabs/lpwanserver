// sqlite3 implementation of lpwanserver database.

"use strict";

// Nuts and bolts sqlite implementation.

// Configuration access.
var nconf = require('nconf');

// Logging
var appLogger = require( "./appLogger.js" );

var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var db;
var initdb;

exports.open = function(create) {
    if (create) {
        initdb = true;
        try {
            fs.unlinkSync(dbFile);
        }
        catch(e) {}
    }

    var dbFile = nconf.get( "db_file" );
    db = new sqlite3.Database(dbFile, loadSchema);
    var mode = create ? "create" : "open";
    appLogger.log(mode+" db: "+ dbFile);
}

exports.open_readonly = function(){
    appLogger.log(dbFile);
    db = new sqlite3.Database(dbFile, sqlite3.OPEN_READONLY);
}

exports.getDevicesForReplication = function(){
  return new Promise(function(resolve, reject) {
    let EUI_to_ignore = "D0000D0000000FFF";
    let sql = 'select * from devices where applicationID != ?';
    db.all(sql, EUI_to_ignore, function(err, rows){
      if (err){
        reject(err);
      } else{
        resolve(rows);
      }

    });
  });
}

exports.close = function() {
    db = undefined;
    appLogger.log("close db: "+dbFile);
}

// Tables/columns are only added if they don't already exist.
function loadSchema() {
    var filePath = nconf.get( "db_schema" );
    var sql = fs.readFileSync(filePath, "utf8");
    db.exec(sql);
}

// Ensure value is in correct format.
exports.sqlValue = function(value) {
    var retVal = value;
    if (typeof(retVal) == 'string') {
        retVal = JSON.stringify(retVal);
    }
    return retVal;
}

// Update an existing record. Key field must be present in object. No non-table
// properties are permitted in object. Returns error or null and the record.
exports.updateRecord = function(table, tkey, record, callback) {
    var keyValue = record[tkey];
    var error = null;
    var values = [];

    // Build up the update string.
    var stmt = "UPDATE " + table + " SET ";
    var i = 0; // Keep track of what non-tkey entry we are on.
    Object.keys(record).forEach(function(key, index) {
        if ( key !== tkey ) {
            if ( i > 0 ) {
                stmt += ", ";
            }
            ++i;
            stmt += key + " = ?";
            values.push( record[key] );
        }
    });

    // Add where clause.
    stmt += " WHERE " + tkey + " = ?";
    values.push( keyValue );

    // Run it.
    db.run( stmt, values, function( err ) {
        if ( err ) {
            callback( err );
        }
        else {
            // Get the resultant record.
            exports.fetchRecord( table, tkey, keyValue, callback );
        }
    });
}

exports.insertRecord = function(table, record, callback) {
  var stmt = "INSERT into " + table; //+ "(?) VALUES (?)";
  var keys = " (";
  var values = []
  var question_marks = "";
  Object.keys(record).forEach(function(key, index) {
      if (index > 0) {
          keys += ', ';
          question_marks += ', ';
      }
      keys += key;
      question_marks += "?";
      values.push(record[key]);
  });
  stmt += keys + ") VALUES (" + question_marks + ")";
  db.run(stmt, values, function(err) {
        record.id = this.lastID;
        callback(err, record);
    });
}


// Insert if not existing, else update. In either case return the resulting row.
exports.upsertRecord = function(table, tkey, record, callback) {
    exports.fetchRecord(table, tkey, record[tkey], function(err, row) {
        if (row) {
            exports.updateRecord(table, tkey, record, function(err) {
                callback(err, row);
            });
        }
        else {
            exports.insertRecord(table, record, function(err, rowId){
                if (!err) {
                    exports.fetchRecord(table, tkey, record[tkey], function(err, row) {
                        callback(err, row);
                    });
                }
                else {
                    callback(err, null);
                }
            });
        }
    });
}

exports.deleteRecord = function(table, key, value, callback) {
    var sql = "DELETE FROM " + table + " WHERE " + key + " = ?"

    db.run(sql, value, function(err) {
        callback(err, value);
    });
}

// Simple fetch using atomic key contained in the object. Use select for more complicated queries.
exports.fetchRecord = function(table, tkey, value, callback) {
    var sql = "SELECT * from " + table + " WHERE " + tkey +" = ?";
    db.get(sql,value, function(err, row) {
        callback(err, row);
    });
}

exports.checkIfApplicationExists = function(name, company, callback) {
    var sql = "SELECT * from applications WHERE applicationVendor = ? AND applicationName = ?";
    db.all(sql, company, name, callback);
}

exports.getApplicationEUI = function(name, company, callback){
    var sql = "SELECT applicationID from applications WHERE applicationVendor = ? AND applicationName = ?";
    db.all(sql, company, name, callback);
}

exports.fetchRecords = function(table, tkey, value, callback) {
    var sql = "SELECT * from " + table + " WHERE " + tkey +" = ?";
    db.all(sql, value, function(err, rows) {
      callback(err, rows);
    });
}

exports.fetchAppDevices = function(appId, callback){
    var sql = "SELECT * from devices, applications WHERE applications.applicationID = ? and devices.applicationID = ?";
    db.all(sql, appId, appId, callback);
}

//Helper function returns an array of promises - one per query
function genPromises(sqlArray) {
  for(var i=0, p=[]; i < sqlArray.length; i++) {
    p[i] = new Promise((resolve, reject) => {
      db.all(sqlArray[i], function(err, rows) {
          if(!err) {
            resolve(rows);
          } else {
            reject(err);
          }
        });
      });
  }
  return(p);
}

exports.fetchInterval = function(table, tkey, startValue, endValue, callback) {
  var sql=[];

  //generate appropriate queries
  if((startValue == "") && (endValue == "")) { //return 1st and last record
    sql[0]  = "SELECT * FROM " + table + " ORDER BY " + tkey + " ASC LIMIT 1;";
    sql[1] = "SELECT * FROM " + table + " ORDER BY " + tkey + " DESC LIMIT 1;";
  } else {
    if(startValue == "") { //return from beginning to specified end value
      sql[0] = "SELECT * from " + table + " WHERE " + tkey +" <= '" + endValue + "';";
    } else if(endValue == "") { //return from specified start value to end
      sql[0] = "SELECT * from " + table + " WHERE " + tkey +" >= '" + startValue + "';";
    } else { //return from  specified start value to specified end value
      sql[0] = "SELECT * from " + table + " WHERE " + tkey +" >= '" + startValue  + "' AND " +
        tkey +" <= '" + endValue + "';";
    }
  }

  //Wait for all promises and return array of results, if all are successfull
  Promise.all(genPromises(sql))
    .then((r) => callback(null, [].concat.apply([], r))) //all queries succeeded - flatten r
    .catch((e) => callback(e, null));   //at least one query failed
};

exports.deleteInterval = function(table, tkey, endValue, callback) {
  var sql=[];

  //generate appropriate queries
  if(endValue == "") { //delete all records
    sql[0]  = "DELETE FROM " + table + ";";
  } else {
    sql[0] = "DELETE FROM " + table + " WHERE " + tkey +" <= '" + endValue + "';";
  }

  //Wait for all promises and return array of results, if all are successfull
  Promise.all(genPromises(sql))
    .then((r) => callback(null, [].concat.apply([], r))) //all queries succeeded - flatten r
    .catch((e) => callback(e, null));   //at least one query failed
};

exports.selectOne = function(sql, callback) {
    db.all(sql, function(err, rows) {
        var row;
        if (rows && rows.length > 0) {
            row = rows[0];
        }
        callback(err, row);
    });
}
exports.select = function(sql, callback) {
    db.all(sql, function(err, rows) {
        callback(err, rows);
    });
}
