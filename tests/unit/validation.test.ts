import { test, expect } from 'vitest'
import { signUpSchema, signInSchema } from '../../src/lib/auth/validation'
import { organizationSchema } from '../../src/lib/organizations/validation'

test('signUpSchema validates correctly', () => {
  expect(signUpSchema.safeParse({ name: 'User', email: 'test@example.com', password: 'password123' }).success).toBe(true)
  expect(signUpSchema.safeParse({ name: '', email: 'test@example.com', password: 'password123' }).success).toBe(false)
  expect(signUpSchema.safeParse({ name: 'User', email: 'invalid', password: 'password123' }).success).toBe(false)
  expect(signUpSchema.safeParse({ name: 'User', email: 'test@example.com', password: 'short' }).success).toBe(false)
})

test('signInSchema validates correctly', () => {
  expect(signInSchema.safeParse({ email: 'test@example.com', password: 'password123' }).success).toBe(true)
  expect(signInSchema.safeParse({ email: 'invalid', password: 'password123' }).success).toBe(false)
  expect(signInSchema.safeParse({ email: 'test@example.com', password: '' }).success).toBe(false)
})

test('organizationSchema validates correctly', () => {
  expect(organizationSchema.safeParse({ name: 'My Org' }).success).toBe(true)
  expect(organizationSchema.safeParse({ name: '' }).success).toBe(false)
  expect(organizationSchema.safeParse({ name: 'a'.repeat(121) }).success).toBe(false)
})
