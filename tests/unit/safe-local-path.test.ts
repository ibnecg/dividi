import { test, expect } from 'vitest'
import { safeLocalPath } from '../../src/lib/auth/safe-local-path'

test('safeLocalPath returns valid local paths unchanged', () => {
  expect(safeLocalPath('/dashboard')).toBe('/dashboard')
  expect(safeLocalPath('/settings/profile')).toBe('/settings/profile')
  expect(safeLocalPath('/')).toBe('/')
})

test('safeLocalPath falls back on external URLs', () => {
  expect(safeLocalPath('http://example.com')).toBe('/')
  expect(safeLocalPath('https://example.com')).toBe('/')
  expect(safeLocalPath('//example.com')).toBe('/')
})

test('safeLocalPath falls back on empty or null paths', () => {
  expect(safeLocalPath('')).toBe('/')
  expect(safeLocalPath(null)).toBe('/')
  expect(safeLocalPath(undefined)).toBe('/')
})

test('safeLocalPath uses custom fallback', () => {
  expect(safeLocalPath('http://example.com', '/home')).toBe('/home')
  expect(safeLocalPath(null, '/home')).toBe('/home')
})
