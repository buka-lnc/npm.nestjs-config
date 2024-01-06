import * as R from 'ramda'
import { ConfigLoader } from '../interfaces/config-loader.interface.js'

export function processEnvLoader(separator = '__'): ConfigLoader {
  return () => {
    let config = {}

    for (const key of Object.keys(process.env)) {
      config = R.assocPath(key.split(separator), process.env[key], config)
    }

    return config
  }
}
