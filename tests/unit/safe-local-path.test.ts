import test from 'node:test'
import assert from 'node:assert'
import { safeLocalPath } from '../../src/lib/auth/safe-local-path.ts'

test('safeLocalPath returns valid local paths unchanged', () => {
  assert.strictEqual(safeLocalPath('/dashboard'), '/dashboard')
  assert.strictEqual(safeLocalPath('/settings/profile'), '/settings/profile')
  assert.strictEqual(safeLocalPath('/'), '/')
})

test('safeLocalPath falls back on external URLs', () => {
  assert.strictEqual(safeLocalPath('http://example.com'), '/')
  assert.strictEqual(safeLocalPath('https://example.com'), '/')
  assert.strictEqual(safeLocalPath('//example.com'), '/')
})

test('safeLocalPath falls back on empty or null paths', () => {
  assert.strictEqual(safeLocalPath(''), '/')
  assert.strictEqual(safeLocalPath(null), '/')
  assert.strictEqual(safeLocalPath(undefined), '/')
})

test('safeLocalPath uses custom fallback', () => {
  assert.strictEqual(safeLocalPath('http://example.com', '/home'), '/home')
  assert.strictEqual(safeLocalPath(null, '/home'), '/home')
})
