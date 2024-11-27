import { afterEach, expect, jest, test } from '@jest/globals'
import * as fs from 'fs/promises'
import { dotenvLoader } from './dotenv-loader.js'
import { Logger } from '@nestjs/common'


afterEach(() => {
  jest.clearAllMocks()
})

test('dotenvLoader', async () => {
  const warn = jest.spyOn(Logger, 'warn')

  await fs.writeFile('/.env', 'TEST=test')

  const testConfig = await dotenvLoader('/.env')({ suppressWarnings: true, providers: [] })
  expect(testConfig).toEqual({ TEST: 'test' })

  const unknownConfig = await dotenvLoader('unknown.env')({ providers: [] })
  expect(unknownConfig).toEqual({})

  expect(warn.mock.calls.length).toBe(1)
})
