import { expect, test } from '@jest/globals'
import { ConfigName } from './config-name.decorator.js'
import { CONFIG_NAME_METADATA_KEY } from '~/constants.js'

class TestClass {
  @ConfigName('test_class_url')
  url!: string
}

test('ConfigName', () => {
  const t = new TestClass()

  const metadataValue = Reflect.getMetadata(CONFIG_NAME_METADATA_KEY, t, 'url')
  expect(metadataValue).toBe('test_class_url')
})
