#!/usr/bin/env node

const { copyDemoData, packageTest } = require('./lib/package')

copyDemoData()
packageTest()