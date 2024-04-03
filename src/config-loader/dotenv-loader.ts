import { Logger } from '@nestjs/common'
import dotenv from 'dotenv'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import * as R from 'ramda'
import { ConfigLoader } from '../interfaces/config-loader.interface.js'
import { ConfigModuleOptions } from '../interfaces/config-module-options.interface.js'


interface DotenvLoaderOptions {
  separator?: string
  jsonParse?: boolean
}

export function dotenvLoader(filepath: string, options: DotenvLoaderOptions): ConfigLoader {
  const separator = options.separator || '__'
  const jsonParse = options.jsonParse || true

  return async (options: ConfigModuleOptions) => {
    if (!existsSync(filepath)) {
      if (!options.suppressWarnings) {
        Logger.warn(`env file not found: ${filepath}`)
      }
      return {}
    }

    const content = await readFile(filepath)
    const config = dotenv.parse(content)

    let result = {}

    for (const key of Object.keys(config)) {
      let value = config[key]
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value)
        } catch (e) {
        // ignore
        }
      }
      result = R.assocPath(key.split(separator), value, result)
    }

    return result
  }
}
