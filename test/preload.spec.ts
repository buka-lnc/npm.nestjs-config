import { expect, test } from '@jest/globals'
import { ConfigModule, Configuration, processEnvLoader } from '~/index'

@Configuration('preloadTestConfig')
class PreloadTestConfig {
  url!: string
}

test('ConfigModule.preload', async () => {
  process.env['preloadTestConfig__url'] = 'http://test.com'

  await ConfigModule.preload({
    providers: [PreloadTestConfig],
    loaders: [processEnvLoader()],
  })

  const testConfig = await ConfigModule.get(PreloadTestConfig)
  expect(testConfig?.url).toEqual('http://test.com')
})
