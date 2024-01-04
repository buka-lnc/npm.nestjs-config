import { ConfigModuleOptions } from './config-module-options.interface.js'

export type ConfigLoader = (options: ConfigModuleOptions) => Promise<Record<string, any>> | Record<string, any>
