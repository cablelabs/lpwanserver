#!/usr/bin/env node

const { copyDemoData, packageE2ETests } = require('./lib/package')

copyDemoData()
packageE2ETests()