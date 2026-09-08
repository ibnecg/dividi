import test from 'node:test'
import assert from 'node:assert'
import { signUpSchema, signInSchema } from '../../src/lib/auth/validation'
import { organizationSchema } from '../../src/lib/organizations/validation'

test('signUpSchema validates correctly', () => {
  assert.strictEqual(signUpSchema.safeParse({ name: 'User', email: 'test@example.com', password: 'password123' }).success, true)
  assert.strictEqual(signUpSchema.safeParse({ name: '', email: 'test@example.com', password: 'password123' }).success, false)
  assert.strictEqual(signUpSchema.safeParse({ name: 'User', email: 'invalid', password: 'password123' }).success, false)
  assert.strictEqual(signUpSchema.safeParse({ name: 'User', email: 'test@example.com', password: 'short' }).success, false)
})

test('signInSchema validates correctly', () => {
  assert.strictEqual(signInSchema.safeParse({ email: 'test@example.com', password: 'password123' }).success, true)
  assert.strictEqual(signInSchema.safeParse({ email: 'invalid', password: 'password123' }).success, false)
  assert.strictEqual(signInSchema.safeParse({ email: 'test@example.com', password: '' }).success, false)
})

test('organizationSchema validates correctly', () => {
  assert.strictEqual(organizationSchema.safeParse({ name: 'My Org' }).success, true)
  assert.strictEqual(organizationSchema.safeParse({ name: '' }).success, false)
  assert.strictEqual(organizationSchema.safeParse({ name: 'a'.repeat(121) }).success, false)
})
