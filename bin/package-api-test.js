#!/usr/bin/env node

const { copyDemoData, packageApiTest } = require('./lib/package')

copyDemoData()
packageApiTest()