#!/usr/bin/env node

const { copyDemoData, packageRestServer } = require('./lib/package')

copyDemoData()
packageRestServer()