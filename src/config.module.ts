/* eslint-disable @typescript-eslint/no-unsafe-return */
import { DynamicModule, FactoryProvider, Logger, Module, Type } from '@nestjs/common'
import { instanceToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import objectPath from 'object-path'
import * as R from 'ramda'
import { Class } from 'type-fest'
import { dotenvLoader } from './config-loader/dotenv-loader.js'
import { processEnvLoader } from './config-loader/process-env-loader.js'
import { ASYNC_OPTIONS_TYPE, ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } from './config.module-definition.js'
import { CONFIGURATION_OBJECTS_METADATA_KEY, CONFIGURATION_OBJECT_PATH_METADATA_KEY, CONFIG_NAME_METADATA_KEY, MODULE_LOADED_CONFIG_TOKEN } from './constants.js'
import { AsyncOptions } from './interfaces/async-options.js'
import { ConfigProvider } from './interfaces/config-provider.interface.js'
import { AsyncOptionsOfModule, InjectedModule } from './interfaces/injected-module.interface.js'
import { objectKeysToCamelCase } from './utils/object-keys-to-camel-case.js'
import { toCamelCase } from './utils/to-camel-case.js'
import { ConfigModuleOptions } from './interfaces/config-module-options.interface.js'


@Module({})
export class ConfigModule extends ConfigurableModuleClass {
  private static providers = new Map()

  private static async createConfigProvider(config: Record<string, any>, ConfigProviderClass: ConfigProvider): Promise<ConfigProvider> {
    const path: string = (Reflect.getMetadata(CONFIGURATION_OBJECT_PATH_METADATA_KEY, ConfigProviderClass) || '').toLowerCase()

    const subConfig = objectPath.get(config, path)

    const instance: typeof ConfigProviderClass = new ConfigProviderClass()

    for (const key of Object.getOwnPropertyNames(instance)) {
      const configName = Reflect.getMetadata(CONFIG_NAME_METADATA_KEY, ConfigProviderClass, key)
      if (configName) {
        const value = objectPath.get(config, configName)
        if (value !== undefined) instance[key] = value
      }

      const value = subConfig && subConfig[toCamelCase(key)]
      if (value !== undefined) instance[key] = value
    }

    const result = instanceToInstance(instance)
    const errors = await validate(result)

    if (errors.length) {
      Logger.error(errors.map((error) => error.toString()).join('\n'))
      throw new Error(errors.map((error) => error.toString()).join('\n'))
    }

    this.providers.set(ConfigProviderClass, result)
    return result
  }

  private static createConfigProviderFactory(ConfigProviderClass: ConfigProvider): FactoryProvider {
    return {
      provide: ConfigProviderClass,
      inject: [MODULE_LOADED_CONFIG_TOKEN],
      useFactory: (config: Record<string, any>) => {
        const provider = this.providers.get(ConfigProviderClass)
        if (provider) return provider

        return this.createConfigProvider(config, ConfigProviderClass)
      },
    }
  }

  private static createLoadedConfigProviderFactory(): FactoryProvider {
    return {
      provide: MODULE_LOADED_CONFIG_TOKEN,
      inject: [MODULE_OPTIONS_TOKEN],
      useFactory: async (options: typeof OPTIONS_TYPE) => {
        const configLoaders = (options.loaders || [processEnvLoader(), '.env'])
          .map((c) => (typeof c === 'string' ? dotenvLoader(c) : c))

        const configs = await Promise.all(configLoaders.map((loader) => loader(options)))
        return objectKeysToCamelCase(R.mergeAll(configs))
      },
    }
  }

  /**
   * Load config and provider before registering the module
   */
  static async preload(options: ConfigModuleOptions): Promise<void> {
    const configLoaders = (options.loaders || [processEnvLoader(), '.env'])
      .map((c) => (typeof c === 'string' ? dotenvLoader(c) : c))

    const configs = await Promise.all(configLoaders.map((loader) => loader(options)))
    const config = objectKeysToCamelCase(R.mergeAll(configs))

    const configProviders: Type<any>[] = Reflect.getMetadata(CONFIGURATION_OBJECTS_METADATA_KEY, ConfigModule) || []
    await Promise.all(configProviders.map((provider) => this.createConfigProvider(config, provider)))
  }

  /**
   * Get the loaded config
   */
  static get<T extends ConfigProvider>(ConfigProviderClass: T): Promise<InstanceType<T> | undefined> {
    return this.providers.get(ConfigProviderClass)
  }

  static register(options: typeof OPTIONS_TYPE): DynamicModule {
    const configProviders = Reflect.getMetadata(CONFIGURATION_OBJECTS_METADATA_KEY, ConfigModule) || []
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
    const configProviders = Reflect.getMetadata(CONFIGURATION_OBJECTS_METADATA_KEY, ConfigModule) || []
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

  static inject<
    M extends InjectedModule,
    AO extends AsyncOptionsOfModule<M>,
    O extends Awaited<ReturnType<AO['useFactory']>>,
    P extends Class<O>
  >(
    provider: P,
    module: M,
  ): DynamicModule

  static inject<
    M extends InjectedModule,
    AO extends AsyncOptionsOfModule<M>,
    O extends Awaited<ReturnType<AO['useFactory']>>,
    P extends Class<any>
  >(
    provider: P,
    module: M,
    optionsFactory: (config: P['prototype']) => Promise<O> | O,
  ): DynamicModule

  static inject<
    M extends InjectedModule,
    AO extends AsyncOptionsOfModule<M>,
    O extends Awaited<ReturnType<AO['useFactory']>>,
    P extends Class<O>
  >(
    provider: P,
    module: M,
    moduleAsyncOptions: Omit<AO, keyof AsyncOptions>,
  ): DynamicModule

  static inject<
    M extends InjectedModule,
    AO extends AsyncOptionsOfModule<M>,
    O extends Awaited<ReturnType<AO['useFactory']>>,
    P extends Class<any>
  >(
    provider: P,
    module: M,
    moduleAsyncOptions: Omit<AO, keyof AsyncOptions>,
    optionsFactory: (config: P['prototype']) => Promise<O>,
  ): DynamicModule

  static inject<
    M extends InjectedModule,
    AO extends AsyncOptionsOfModule<M>,
    O extends Awaited<ReturnType<AO['useFactory']>>,
    P extends Class<any>
  >(
    provider: P,
    module: M,
    moduleAsyncOptionsOrFactory?: Omit<AO, keyof AsyncOptions> | ((config: P) => Promise<O> | O),
    optionsFactory?: (config: P['prototype']) => Promise<O>,
  ): DynamicModule {
    let moduleAsyncOptions: Omit<AO, keyof AsyncOptions> | undefined = undefined
    let useFactory: AsyncOptions['useFactory'] = (config) => config

    if (typeof moduleAsyncOptionsOrFactory === 'function') {
      useFactory = moduleAsyncOptionsOrFactory as any
    } else if (typeof moduleAsyncOptionsOrFactory === 'object') {
      moduleAsyncOptions = moduleAsyncOptionsOrFactory
    }

    if (typeof optionsFactory === 'function') {
      useFactory = optionsFactory as any
    }


    if ('registerAsync' in module && module.registerAsync) {
      return module.registerAsync({
        ...moduleAsyncOptions,
        inject: [provider],
        useFactory,
      })
    }

    if ('forRootAsync' in module && module.forRootAsync) {
      return module.forRootAsync({
        ...moduleAsyncOptions,
        inject: [provider],
        useFactory,
      })
    }

    throw new TypeError('Invalid module')
  }
}
