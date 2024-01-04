
import { expect, test } from '@jest/globals'
import { objectKeysToCamelCase } from './object-keys-to-camel-case.js'

test('objectKeysToSnakeCase', () => {
  const obj = objectKeysToCamelCase({
    first_name: 'John',
    LastName: 'Doe',
    AGE: 42,
    friends: [
      {
        'first-name': 'Tom',
        LAST_NAME: 'Smith',
        age: 102,
      },
    ],
  })

  expect(obj).toEqual({
    firstName: 'John',
    lastName: 'Doe',
    age: 42,
    friends: [
      {
        firstName: 'Tom',
        lastName: 'Smith',
        age: 102,
      },
    ],
  })
})
