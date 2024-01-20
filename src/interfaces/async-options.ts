import { FactoryProvider } from '@nestjs/common'


export interface AsyncOptions {
  inject?: FactoryProvider['inject']
  useFactory: <T extends object>(...args: any[]) => Promise<T> | T
}

