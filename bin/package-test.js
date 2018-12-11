#!/usr/bin/env node

const { copyDemoData, packageTests } = require('./lib/package')

copyDemoData()
packageTests()