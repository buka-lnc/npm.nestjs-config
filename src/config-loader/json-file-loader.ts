import { Logger } from '@nestjs/common'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { ConfigLoader } from '~/interfaces/config-loader.interface.js'
import { ConfigModuleOptions } from '~/interfaces/config-module-options.interface.js'


export function jsonFileLoader(filepath: string, encoding: BufferEncoding = 'utf-8'): ConfigLoader {
  return async (options: ConfigModuleOptions) => {
    if (!existsSync(filepath)) {
      if (!options.suppressWarnings) {
        Logger.warn(`env file not found: ${filepath}`)
      }
      return {}
    }

    const content = await readFile(filepath)
    return JSON.parse(content.toString(encoding)) as Record<string, string>
  }
}
