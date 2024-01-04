import { ConfigLoader } from './config-loader.interface.js'

export interface ConfigModuleOptions {
  /**
   * @default ".env"
   */
  config?: (string | ConfigLoader)[]

  suppressWarnings?: true
}
