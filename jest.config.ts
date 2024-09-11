import type { JestConfigWithTsJest } from 'ts-jest'
import { pathsToModuleNameMapper } from 'ts-jest'
import { compilerOptions } from './tsconfig.json'

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testMatch: [
    '<rootDir>/__tests__/**/*.spec.ts',
    '<rootDir>/src/**/*.spec.ts',
  ],
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['./src/**'],
  coverageReporters: ['text', 'cobertura'],
  coveragePathIgnorePatterns: [
    '.*__snapshots__/.*',
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    ...pathsToModuleNameMapper(compilerOptions.paths),
  },
}

export default jestConfig
