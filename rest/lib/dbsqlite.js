'use strict'
const nconf = require('nconf')
const appLogger = require('./appLogger.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')

var db
var dbFile

exports.open = function (create) {
  dbFile = nconf.get('db_file')
  if (create) {
    try {
      fs.unlinkSync(dbFile)
    }
    catch (e) {}
  }
  db = new sqlite3.Database(dbFile, loadSchema)
  let mode = create ? 'create' : 'open'
  appLogger.log(mode + ' db: ' + dbFile)
}

exports.open_readonly = function () {
  dbFile = nconf.get('db_file')
  appLogger.log(dbFile)
  db = new sqlite3.Database(dbFile, sqlite3.OPEN_READONLY)
}

exports.close = function () {
  db = undefined
  appLogger.log('close db: ' + dbFile)
}

exports.sqlValue = function (value) {
  let retVal = value
  if (typeof (retVal) === 'string') {
    retVal = JSON.stringify(retVal)
  }
  return retVal
}

exports.insertRecord = function (table, record, callback) {
  let stmt = 'INSERT into ' + table // + "(?) VALUES (?)";
  let keys = ' ('
  let values = []
  let questionMarks = ''
  Object.keys(record).forEach(function (key, index) {
    if (index > 0) {
      keys += ', '
      questionMarks += ', '
    }
    keys += key
    questionMarks += '?'
    values.push(record[key])
  })
  stmt += keys + ') VALUES (' + questionMarks + ')'
  db.run(stmt, values, function (err) {
    record.id = this.lastID
    callback(err, record)
  })
}

exports.fetchRecord = function (table, tkey, value, callback) {
  let sql = 'SELECT * from ' + table + ' WHERE ' + tkey + ' = ?'
  db.get(sql, value, function (err, row) {
    callback(err, row)
  })
}

exports.updateRecord = function (table, tkey, record, callback) {
  let keyValue = record[tkey]
  let values = []

  // Build up the update string.
  let stmt = 'UPDATE ' + table + ' SET '
  let i = 0 // Keep track of what non-tkey entry we are on.
  Object.keys(record).forEach(function (key, index) {
    if (key !== tkey) {
      if (i > 0) {
        stmt += ', '
      }
      ++i
      stmt += key + ' = ?'
      values.push(record[key])
    }
  })

  // Add where clause.
  stmt += ' WHERE ' + tkey + ' = ?'
  values.push(keyValue)

  // Run it.
  db.run(stmt, values, function (err) {
    if (err) {
      callback(err)
    }
    else {
      // Get the resultant record.
      exports.fetchRecord(table, tkey, keyValue, callback)
    }
  })
}

exports.upsertRecord = function (table, tkey, record, callback) {
  // eslint-disable-next-line handle-callback-err
  exports.fetchRecord(table, tkey, record[tkey], function (err, row) {
    if (row) {
      exports.updateRecord(table, tkey, record, function (err, urow) {
        callback(err, urow)
      })
    }
    else {
      exports.insertRecord(table, record, function (err, rowId) {
        if (!err) {
          exports.fetchRecord(table, tkey, record[tkey], function (err, row) {
            callback(err, row)
          })
        }
        else {
          callback(err, null)
        }
      })
    }
  })
}

exports.deleteRecord = function (table, key, value, callback) {
  let sql = 'DELETE FROM ' + table + ' WHERE ' + key + ' = ?'

  db.run(sql, value, function (err) {
    callback(err, value)
  })
}

exports.fetchInterval = function (table, tkey, startValue, endValue, callback) {
  let sql = []

  // generate appropriate queries
  if ((startValue === '') && (endValue === '')) { // return 1st and last record
    sql[0] = 'SELECT * FROM ' + table + ' ORDER BY ' + tkey + ' ASC LIMIT 1;'
    sql[1] = 'SELECT * FROM ' + table + ' ORDER BY ' + tkey + ' DESC LIMIT 1;'
  }
  else {
    if (startValue === '') { // return from beginning to specified end value
      sql[0] = 'SELECT * from ' + table + ' WHERE ' + tkey + " <= '" + endValue + "';"
    }
    else if (endValue === '') { // return from specified start value to end
      sql[0] = 'SELECT * from ' + table + ' WHERE ' + tkey + " >= '" + startValue + "';"
    }
    else { // return from  specified start value to specified end value
      sql[0] = 'SELECT * from ' + table + ' WHERE ' + tkey + " >= '" + startValue + "' AND " +
        tkey + " <= '" + endValue + "';"
    }
  }

  // Wait for all promises and return array of results, if all are successful
  Promise.all(genPromises(sql))
    .then((r) => callback(null, [].concat.apply([], r))) // all queries succeeded - flatten r
    .catch((e) => callback(e, null)) // at least one query failed
}

exports.deleteInterval = function (table, tkey, endValue, callback) {
  let sql = []

  // generate appropriate queries
  if (endValue === '') { // delete all records
    sql[0] = 'DELETE FROM ' + table + ';'
  }
  else {
    sql[0] = 'DELETE FROM ' + table + ' WHERE ' + tkey + " <= '" + endValue + "';"
  }

  // Wait for all promises and return array of results, if all are successfull
  Promise.all(genPromises(sql))
    .then((r) => callback(null, [].concat.apply([], r))) // all queries succeeded - flatten r
    .catch((e) => callback(e, null)) // at least one query failed
}

exports.selectOne = function (sql, callback) {
  db.all(sql, function (err, rows) {
    let row
    if (rows && rows.length > 0) {
      row = rows[0]
    }
    callback(err, row)
  })
}
exports.select = function (sql, callback) {
  db.all(sql, function (err, rows) {
    callback(err, rows)
  })
}

function loadSchema () {
  let filePath = nconf.get('db_schema')
  let sql = fs.readFileSync(filePath, 'utf8')
  db.exec(sql)
}

// Helper function returns an array of promises - one per query
function genPromises (sqlArray) {
  let p = []
  for (let i = 0; i < sqlArray.length; i++) {
    p[i] = new Promise((resolve, reject) => {
      db.all(sqlArray[i], function (err, rows) {
        if (!err) {
          resolve(rows)
        }
        else {
          reject(err)
        }
      })
    })
  }
  return (p)
}
