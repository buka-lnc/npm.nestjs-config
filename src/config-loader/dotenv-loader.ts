import { Logger } from '@nestjs/common'
import dotenv from 'dotenv'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import * as R from 'ramda'
import { ConfigLoader } from '../interfaces/config-loader.interface.js'
import { ConfigModuleOptions } from '../interfaces/config-module-options.interface.js'


export function dotenvLoader(filepath: string, separator = '__'): ConfigLoader {
  return async (options: ConfigModuleOptions) => {
    if (!existsSync(filepath)) {
      if (!options.suppressWarnings) {
        Logger.warn(`env file not found: ${filepath}`)
      }
      return {}
    }

    const content = await readFile(filepath)
    const config = dotenv.parse(content)

    const result = {}

    for (const key of Object.keys(config)) {
      R.assocPath(key.split(separator), config[key], result)
    }

    return result
  }
}
