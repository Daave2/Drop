import { describe, expect, test } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  test('merges duplicate classes', () => {
    expect(cn('p-2', 'p-2')).toBe('p-2')
  })

  test('resolves conflicting classes using last one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})
