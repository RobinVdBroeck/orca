import { describe, expect, it } from 'vitest'
import { summarizeWorktreeFolderStatus } from './worktree-folder-status'

describe('summarizeWorktreeFolderStatus', () => {
  it('returns the most urgent member status', () => {
    expect(summarizeWorktreeFolderStatus(['inactive', 'done', 'working'])).toBe('working')
    expect(summarizeWorktreeFolderStatus(['active', 'permission', 'working'])).toBe('permission')
    expect(summarizeWorktreeFolderStatus(['inactive', 'active'])).toBe('active')
  })

  it('returns null for an empty folder', () => {
    expect(summarizeWorktreeFolderStatus([])).toBeNull()
  })
})
