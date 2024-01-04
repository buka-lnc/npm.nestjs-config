import { expect, test } from '@jest/globals'
import { toCamelCase } from './to-camel-case.js'

test('toCamelCase', () => {
  expect(toCamelCase('foo-bar')).toBe('fooBar')
  expect(toCamelCase('FooBar')).toBe('fooBar')
  expect(toCamelCase('fooBar')).toBe('fooBar')
  expect(toCamelCase('foo_bar')).toBe('fooBar')
  expect(toCamelCase('FOO_BAR')).toBe('fooBar')
  expect(toCamelCase('Foo_Bar')).toBe('fooBar')
  expect(toCamelCase('foo.bar')).toBe('foo.bar')
  expect(toCamelCase('foo.ZBar')).toBe('foo.zBar')
})
