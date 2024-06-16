import { expect, test } from '@jest/globals'
import { Configuration } from './configuration.decorator.js'
import { CONFIGURATION_OBJECTS_METADATA_KEY } from '~/constants.js'
import { ConfigModule } from '~/config.module.js'


@Configuration('test')
class TestClass {
}

test('Configuration', () => {
  const modules = Reflect.getMetadata(CONFIGURATION_OBJECTS_METADATA_KEY, ConfigModule)
  expect(modules).toEqual([TestClass])
})
