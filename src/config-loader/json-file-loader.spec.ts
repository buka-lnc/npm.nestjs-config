import { afterEach, expect, jest, test } from '@jest/globals'
import { jsonFileLoader } from './json-file-loader.js'
import * as fs from 'fs/promises'
import { Logger } from '@nestjs/common'


afterEach(() => {
  jest.clearAllMocks()
})


test('jsonFileLoader', async () => {
  const warn = jest.spyOn(Logger, 'warn')

  fs.writeFile('test.json', '{ "test": "test" }')

  const testConfig = await jsonFileLoader('test.json')({ suppressWarnings: true, providers: [] })
  expect(testConfig).toEqual({ test: 'test' })

  const unknownConfig = await jsonFileLoader('unknown.json')({ providers: [] })
  expect(unknownConfig).toEqual({})

  expect(warn.mock.calls.length).toBe(1)
})
