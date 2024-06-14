import { Transform } from 'class-transformer'

export function StaticConfig(): PropertyDecorator {
  return Transform(({ key, obj }) => obj[key])
}
