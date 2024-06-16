import { expect, test } from '@jest/globals'
import { StaticConfig } from './static-config.decorator.js'
import { instanceToInstance } from 'class-transformer'

class TestClass {
  @StaticConfig()
  options = {
    getTest() {
      return 'test'
    },
  }
}

test('StaticConfig', () => {
  const t = new TestClass()

  const i = instanceToInstance(t)
  expect(i).toBeInstanceOf(TestClass)
  expect(i.options).toBe(t.options)
})
