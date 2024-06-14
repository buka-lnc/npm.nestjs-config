import { expect, test } from '@jest/globals'
import { deepMergeAll } from './deep-merge-all.js'

test('deepMergeAll', () => {
  expect(
    deepMergeAll([
      { a: { b: { c: 1 } } },
      { a: { b: { d: 2 } } },

    ])
  ).toEqual({ a: { b: { c: 1, d: 2 } } })
})
