import { expect, test } from '@jest/globals'
import { composeLoader } from './compose-loader.js'


test('composeLoader', async () => {
  const result = await composeLoader([
    async () => ({ a: 1 }),
    async () => ({ b: 2 }),
    async () => ({ c: 3 }),
  ])({
    providers: [],
  })

  expect(result).toEqual({
    a: 1,
    b: 2,
    c: 3,
  })
})
