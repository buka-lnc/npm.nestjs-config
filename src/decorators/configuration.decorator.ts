import { ConfigModule } from '~/config.module.js'
import { CONFIGURATION_OBJECTS_METADATA_KEY, CONFIGURATION_OBJECT_PATH_METADATA_KEY } from '../constants.js'


export function Configuration(path?: string): ClassDecorator {
  console.log('🚀 ~ Configuration ~ path:', path)
  return (target) => {
    console.log('🚀 ~ return ~ target:', target)
    Reflect.defineMetadata(CONFIGURATION_OBJECT_PATH_METADATA_KEY, path, target)

    const configurations = Reflect.getMetadata(CONFIGURATION_OBJECTS_METADATA_KEY, ConfigModule) || []
    Reflect.defineMetadata(CONFIGURATION_OBJECTS_METADATA_KEY, [...configurations, target], ConfigModule)
  }
}
