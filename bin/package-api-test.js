#!/usr/bin/env node

const { copyDemoData, packageApiTests } = require('./lib/package')

copyDemoData()
packageApiTests()