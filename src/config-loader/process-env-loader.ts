import * as R from 'ramda'
import { ConfigLoader } from '../interfaces/config-loader.interface.js'

export function processEnvLoader(separator = '__'): ConfigLoader {
  return () => {
    const config = {}

    for (const key of Object.keys(process.env)) {
      R.assocPath(key.split(separator), process.env[key], config)
    }

    return config
  }
}
