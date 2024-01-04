import { CONFIG_NAME_METADATA_KEY } from '~/constants.js'


export function ConfigName(): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflect.defineMetadata(CONFIG_NAME_METADATA_KEY, propertyKey, target)
  }
}
