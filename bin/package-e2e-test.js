#!/usr/bin/env node

const { copyDemoData, packageE2ETest } = require('./lib/package')

copyDemoData()
packageE2ETest()