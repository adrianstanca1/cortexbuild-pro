import { describe, expect, test } from 'vitest'

describe('example test suite', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2)
  })

  test('should match string', () => {
    expect('hello').toMatch(/ello/)
  })
})