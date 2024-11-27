/* eslint-disable @typescript-eslint/no-require-imports */
const { Volume } = require('memfs')
module.exports = Volume.fromJSON({}).promises

