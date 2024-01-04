import { camelCase } from 'change-case-all'

export function toCamelCase(str: string): string {
  return str
    .split('.')
    .map((word) => camelCase(word))
    .join('.')
}
