export { ConfigModule } from './config.module.js'
export type { ConfigModuleOptions } from './interfaces/config-module-options.interface.js'

export { ConfigName } from './decorators/config-name.decorator.js'
export { Configuration } from './decorators/configuration.decorator.js'

export { composeLoader } from './utils/compose-loader.js'
export { dotenvLoader } from './config-loader/dotenv-loader.js'
export { jsonFileLoader } from './config-loader/json-file-loader.js'
export { processEnvLoader } from './config-loader/process-env-loader.js'
export type { ConfigLoader } from './interfaces/config-loader.interface.js'
