import { DynamicModule, FactoryProvider, Logger, Module } from '@nestjs/common'
import { instanceToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import objectPath from 'object-path'
import * as R from 'ramda'
import { dotenvLoader } from './config-loader/dotenv-loader.js'
import { processEnvLoader } from './config-loader/process-env-loader.js'
import { ASYNC_OPTIONS_TYPE, ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } from './config.module-definition.js'
import { CONFIGURATION_OBJECTS_METADATA_KEY, CONFIGURATION_OBJECT_PATH_METADATA_KEY, CONFIG_NAME_METADATA_KEY, MODULE_LOADED_CONFIG_TOKEN } from './constants.js'
import { ConfigProvider } from './interfaces/config-provider.interface.js'
import { objectKeysToCamelCase } from './utils/object-keys-to-camel-case.js'
import { toCamelCase } from './utils/to-camel-case.js'


@Module({})
export class ConfigModule extends ConfigurableModuleClass {
  private static createConfigProviderFactory(ConfigProviderClass: ConfigProvider): FactoryProvider {
    return {
      provide: ConfigProviderClass,
      inject: [MODULE_LOADED_CONFIG_TOKEN],
      useFactory: async (config: Record<string, any>) => {
        const path: string = (Reflect.getMetadata(CONFIGURATION_OBJECT_PATH_METADATA_KEY, ConfigProviderClass) || '').toLowerCase()

        const subConfig = objectPath.get(config, path)

        const instance: typeof ConfigProviderClass = new ConfigProviderClass()

        for (const key of Object.getOwnPropertyNames(instance)) {
          const configName = Reflect.getMetadata(CONFIG_NAME_METADATA_KEY, ConfigProviderClass, key)
          if (configName) {
            instance[key] = subConfig[toCamelCase(configName)]
          }

          instance[key] = subConfig[toCamelCase(key)]
        }

        const errors = await validate(instance)

        if (errors.length) {
          Logger.error(errors.map((error) => error.toString()).join('\n'))
          throw new Error(errors.map((error) => error.toString()).join('\n'))
        }

        return instanceToInstance(instance)
      },
    }
  }

  private static createLoadedConfigProviderFactory(): FactoryProvider {
    return {
      provide: MODULE_LOADED_CONFIG_TOKEN,
      inject: [MODULE_OPTIONS_TOKEN],
      useFactory: async (options: typeof OPTIONS_TYPE) => {
        const configLoaders = (options.config || [processEnvLoader(), '.env'])
          .map((c) => (typeof c === 'string' ? dotenvLoader(c) : c))

        const configs = await Promise.all(configLoaders.map((loader) => loader(options)))
        return objectKeysToCamelCase(R.mergeAll(configs))
      },
    }
  }

  static register(options: typeof OPTIONS_TYPE): DynamicModule {
    const configProviders = Reflect.getMetadata(CONFIGURATION_OBJECTS_METADATA_KEY, ConfigModule)
    const dynamicModule = super.register(options)

    dynamicModule.providers = [
      ...(dynamicModule.providers || []),
      this.createLoadedConfigProviderFactory(),
      ...configProviders.map((provider) => this.createConfigProviderFactory(provider)),
    ]

    dynamicModule.exports = [
      ...(dynamicModule.exports || []),
      ...configProviders,
    ]

    return dynamicModule
  }

  static registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    const configProviders = Reflect.getMetadata(CONFIGURATION_OBJECTS_METADATA_KEY, ConfigModule)
    const dynamicModule = super.registerAsync(options)

    dynamicModule.providers = [
      ...(dynamicModule.providers || []),
      this.createLoadedConfigProviderFactory(),
      ...configProviders.map((provider) => this.createConfigProviderFactory(provider)),
    ]

    dynamicModule.exports = [
      ...(dynamicModule.exports || []),
      ...configProviders,
    ]

    return dynamicModule
  }
}
