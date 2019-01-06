// eslint-disable-next-line no-unused-vars
const assert = require('assert')
// eslint-disable-next-line no-unused-vars
const chai = require('chai')
// eslint-disable-next-line no-unused-vars
const should = chai.should()
const nconf = require('nconf')
const fs = require('fs')
const TestModule = require('../../../rest/lib/dbsqlite')
const testName = 'DB SQLITE'
const tempDbFile = '/tmp/test.sqlite3'

describe('Unit Tests for ' + testName, () => {
  let deviceId = 0
  before('Setup ENV', async () => {
    nconf.file('defaults', { file: 'config/defaults.hjson', format: require('hjson') })
    nconf.set('db_file', tempDbFile)
  })
  after('Shutdown', async () => {
    fs.unlinkSync(tempDbFile)
  })
  it(testName + ' Open with Create', (done) => {
    if (fs.existsSync(tempDbFile)) {
      done(new Error('File Should not exist before create'))
    }
    else {
      TestModule.open(true)
      setTimeout(() => {
        if (fs.existsSync(tempDbFile)) {
          done()
        }
        else {
          done(new Error('File Should exist after create'))
        }
      }, 1000)
    }
  })
  it(testName + ' Close', (done) => {
    TestModule.close()
    done()
  })
  it(testName + ' Open without Create', (done) => {
    if (!fs.existsSync(tempDbFile)) {
      done(new Error('File Should exist before create'))
    }
    else {
      TestModule.open(false)
      setTimeout(() => {
        if (fs.existsSync(tempDbFile)) {
          done()
        }
        else {
          done(new Error('File Should still exist after open'))
        }
      }, 1000)
    }
  })
  it(testName + ' Open Readonly', (done) => {
    TestModule.open_readonly()
    let record = {
      name: 'test',
      description: 'test description',
      applicationId: 1,
      deviceModel: 'AR2'
    }
    TestModule.insertRecord('devices', record, (err, record) => {
      TestModule.close()
      if (err) done()
      else done(new Error('Should not be allowed to write to READ ONLY DB'))
    })
  })
  it(testName + ' SQL Value', (done) => {
    TestModule.sqlValue('Test123').should.equal('"Test123"')
    TestModule.sqlValue(1).should.equal(1)
    TestModule.sqlValue('1').should.equal('"1"')
    done()
  })
  it(testName + ' Insert Record', (done) => {
    TestModule.open(false)
    let record = {
      name: 'test',
      description: 'test description',
      applicationId: 1,
      deviceModel: 'AR2'
    }
    TestModule.insertRecord('devices', record, (err, record) => {
      if (err) done(err)
      else {
        record.should.have.property('id')
        record.should.have.property('name')
        record.should.have.property('description')
        record.should.have.property('applicationId')
        record.should.have.property('deviceModel')
        record.should.have.property('id')
        record.name.should.equal(record.name)
        record.description.should.equal(record.description)
        record.applicationId.should.equal(record.applicationId)
        record.deviceModel.should.equal(record.deviceModel)
        deviceId = record.id
        done()
      }
    })
  })
  it(testName + ' Fetch Record', (done) => {
    TestModule.fetchRecord('devices', 'id', deviceId, (err, record) => {
      if (err) done(err)
      else {
        record.should.have.property('id')
        record.should.have.property('name')
        record.should.have.property('description')
        record.should.have.property('applicationId')
        record.should.have.property('deviceModel')
        record.should.have.property('id')
        record.name.should.equal(record.name)
        record.description.should.equal(record.description)
        record.applicationId.should.equal(record.applicationId)
        record.deviceModel.should.equal(record.deviceModel)
        record.id.should.equal(deviceId)
        done()
      }
    })
  })
  it(testName + ' Update Record', (done) => {
    let updatedRecord = {
      id: deviceId,
      name: 'test',
      description: 'updated description',
      applicationId: 1,
      deviceModel: 'AR3'
    }
    TestModule.updateRecord('devices', 'id', updatedRecord, (err, record) => {
      if (err) done(err)
      else {
        record.should.have.property('id')
        record.should.have.property('name')
        record.should.have.property('description')
        record.should.have.property('applicationId')
        record.should.have.property('deviceModel')
        record.should.have.property('id')
        record.name.should.equal(updatedRecord.name)
        record.description.should.equal(updatedRecord.description)
        record.applicationId.should.equal(updatedRecord.applicationId)
        record.deviceModel.should.equal(updatedRecord.deviceModel)
        record.id.should.equal(deviceId)
        done()
      }
    })
  })
  it(testName + ' Upsert Existing Record', (done) => {
    let secondUpdate = {
      id: deviceId,
      name: 'test',
      description: 'twice updated description',
      applicationId: 1,
      deviceModel: 'AR4'
    }
    TestModule.upsertRecord('devices', 'id', secondUpdate, (err, record) => {
      if (err) done(err)
      else {
        record.should.have.property('id')
        record.should.have.property('name')
        record.should.have.property('description')
        record.should.have.property('applicationId')
        record.should.have.property('deviceModel')
        record.should.have.property('id')
        record.name.should.equal(secondUpdate.name)
        record.description.should.equal(secondUpdate.description)
        record.applicationId.should.equal(secondUpdate.applicationId)
        record.deviceModel.should.equal(secondUpdate.deviceModel)
        record.id.should.equal(deviceId)
        done()
      }
    })
  })
  it(testName + ' Upsert New Record', (done) => {
    let newRecord = {
      name: 'test2',
      description: 'second description',
      applicationId: 1,
      deviceModel: 'KB4'
    }
    TestModule.upsertRecord('devices', 'id', newRecord, (err, record) => {
      if (err) done(err)
      else {
        record.should.have.property('id')
        record.should.have.property('name')
        record.should.have.property('description')
        record.should.have.property('applicationId')
        record.should.have.property('deviceModel')
        record.should.have.property('id')
        record.name.should.equal(newRecord.name)
        record.description.should.equal(newRecord.description)
        record.applicationId.should.equal(newRecord.applicationId)
        record.deviceModel.should.equal(newRecord.deviceModel)
        done()
      }
    })
  })
  it(testName + ' Fetch Interval', (done) => {
    TestModule.fetchInterval('devices', 'id', 1, 2, (err, records) => {
      if (err) done(err)
      else {
        records.length.should.equal(2)
        done()
      }
    })
  })
  it(testName + ' Fetch Interval Larger than there are', (done) => {
    TestModule.fetchInterval('devices', 'id', 1, 5, (err, records) => {
      if (err) done(err)
      else {
        records.length.should.equal(2)
        done()
      }
    })
  })
  it(testName + ' Fetch Interval of 1', (done) => {
    TestModule.fetchInterval('devices', 'id', 2, 2, (err, records) => {
      if (err) done(err)
      else {
        records.length.should.equal(1)
        done()
      }
    })
  })
  it(testName + ' Select Both', (done) => {
    let sql = 'SELECT * from devices WHERE applicationId = 1'
    TestModule.select(sql, (err, records) => {
      if (err) done(err)
      else {
        records.length.should.equal(2)
        done()
      }
    })
  })
  it(testName + ' Select One of Two', (done) => {
    let sql = 'SELECT * from devices WHERE name = "test"'
    TestModule.select(sql, (err, records) => {
      if (err) done(err)
      else {
        records.length.should.equal(1)
        done()
      }
    })
  })
  it(testName + ' SelectOne', (done) => {
    let sql = 'SELECT * from devices WHERE applicationId = 1'
    TestModule.selectOne(sql, (err, record) => {
      if (err) done(err)
      else {
        record.should.have.property('id')
        record.id.should.equal(deviceId)
        done()
      }
    })
  })

  it(testName + ' Delete Record', (done) => {
    TestModule.deleteRecord('devices', 'id', deviceId, (err, id) => {
      if (err) done(err)
      else {
        id.should.equal(deviceId)
        TestModule.fetchRecord('devices', 'id', deviceId, (err, record) => {
          if (err) done()
          else done(record)
        })
      }
    })
  })
  it(testName + ' Delete Interval', (done) => {
    TestModule.deleteInterval('devices', 'id', 3, (err, result) => {
      if (err) done(err)
      else {
        done()
      }
    })
  })
})
