/* eslint-disable @typescript-eslint/no-unsafe-return */
import { DynamicModule, FactoryProvider, Logger, Module, Type } from '@nestjs/common'
import { instanceToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import objectPath from 'object-path'
import { Class } from 'type-fest'
import { dotenvLoader } from './config-loader/dotenv-loader.js'
import { processEnvLoader } from './config-loader/process-env-loader.js'
import { ASYNC_OPTIONS_TYPE, ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } from './config.module-definition.js'
import { CONFIGURATION_OBJECTS_METADATA_KEY, CONFIGURATION_OBJECT_PATH_METADATA_KEY, CONFIG_NAME_METADATA_KEY, MODULE_LOADED_CONFIG_TOKEN, RESET_COLOR } from './constants.js'
import { AsyncOptions } from './interfaces/async-options.js'
import { ConfigProvider } from './interfaces/config-provider.interface.js'
import { AsyncOptionsOfModule, InjectedModule } from './interfaces/injected-module.interface.js'
import { objectKeysToCamelCase } from './utils/object-keys-to-camel-case.js'
import { toCamelCase } from './utils/to-camel-case.js'
import { ConfigModuleOptions } from './interfaces/config-module-options.interface.js'
import { deepMergeAll } from './utils/deep-merge-all.js'
import { inspect } from 'util'


@Module({})
export class ConfigModule extends ConfigurableModuleClass {
  private static config: object | null = null
  private static providers = new Map()

  private static async createConfigProvider(options: typeof OPTIONS_TYPE, config: Record<string, any>, ConfigProviderClass: ConfigProvider): Promise<ConfigProvider> {
    if (this.providers.has(ConfigProviderClass)) {
      return this.providers.get(ConfigProviderClass)
    }

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
      const message = errors
        .map((error) => {
          let message = 'An instance of LoggerConfig has failed the validation:\n'
          for (const constraint in error.constraints) {
            message += `  - Property: \`${error.property}\`\n`
            message += `    Value: ${JSON.stringify(error.value)}\n`
            message += `    Constraint: ${constraint}\n`
            message += `    Expect: ${error.constraints[constraint]}\n`
          }

          return message
        })
        .join('\n')

      Logger.error(message)
      throw new Error(message)
    }


    if (options.debug) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      Logger.debug(`${ConfigProviderClass.name} initialized${RESET_COLOR}\n${inspect(result, false, null, true)}`, '@buka/nestjs-config')
    }

    this.providers.set(ConfigProviderClass, result)
    return result
  }

  private static async loadConfig(options: typeof OPTIONS_TYPE): Promise<object> {
    if (this.config !== null) return this.config

    const configLoaders = (options.loaders || [processEnvLoader(), '.env'])
      .map((c) => (typeof c === 'string' ? dotenvLoader(c) : c))

    const configs = await Promise.all(configLoaders.map((loader) => loader(options)))
    const config = objectKeysToCamelCase(deepMergeAll(configs))
    this.config = config
    return config
  }

  private static createConfigProviderFactory(ConfigProviderClass: ConfigProvider): FactoryProvider {
    return {
      provide: ConfigProviderClass,
      inject: [MODULE_OPTIONS_TOKEN, MODULE_LOADED_CONFIG_TOKEN],
      useFactory: (options: typeof OPTIONS_TYPE, config: Record<string, any>) => {
        const provider = this.providers.get(ConfigProviderClass)
        if (provider) return provider

        return this.createConfigProvider(options, config, ConfigProviderClass)
      },
    }
  }

  private static createLoadedConfigProviderFactory(): FactoryProvider {
    return {
      provide: MODULE_LOADED_CONFIG_TOKEN,
      inject: [MODULE_OPTIONS_TOKEN],
      useFactory: async (options: typeof OPTIONS_TYPE) => this.loadConfig(options),
    }
  }

  /**
   * Load config and provider before registering the module
   */
  static async preload(options: ConfigModuleOptions): Promise<void> {
    const config = await this.loadConfig(options)
    const configProviders: Type<any>[] = Reflect.getMetadata(CONFIGURATION_OBJECTS_METADATA_KEY, ConfigModule) || []
    await Promise.all(configProviders.map((provider) => this.createConfigProvider(options, config, provider)))
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
