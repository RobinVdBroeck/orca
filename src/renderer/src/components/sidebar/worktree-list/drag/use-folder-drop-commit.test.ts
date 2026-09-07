import { describe, expect, it } from 'vitest'
import { repo, worktree } from '../../worktree-list-groups-test-fixtures'
import { isEligibleWorktreeFolderDrop } from './use-folder-drop-commit'

const inTriage = { ...worktree, id: 'wt-triage' }
const atRoot = { ...worktree, id: 'wt-root' }
const otherRepo = { ...worktree, id: 'wt-other', repoId: 'repo-other' }
const worktreeMap = new Map([inTriage, atRoot, otherRepo].map((item) => [item.id, item]))
const folderIdByWorktree = { 'wt-triage': 'f-triage' }

describe('isEligibleWorktreeFolderDrop', () => {
  it('accepts a card moving into a different folder of its own project', () => {
    expect(
      isEligibleWorktreeFolderDrop({
        target: { repoId: repo.id, folderId: 'f-triage' },
        draggedIds: ['wt-root'],
        worktreeMap,
        folderIdByWorktree
      })
    ).toBe(true)
  })

  it('accepts a folder member dropped on its repo header (back to root)', () => {
    expect(
      isEligibleWorktreeFolderDrop({
        target: { repoId: repo.id, folderId: null },
        draggedIds: ['wt-triage'],
        worktreeMap,
        folderIdByWorktree
      })
    ).toBe(true)
  })

  it('rejects a no-op drop and cards from another project', () => {
    expect(
      isEligibleWorktreeFolderDrop({
        target: { repoId: repo.id, folderId: 'f-triage' },
        draggedIds: ['wt-triage'],
        worktreeMap,
        folderIdByWorktree
      })
    ).toBe(false)
    expect(
      isEligibleWorktreeFolderDrop({
        target: { repoId: repo.id, folderId: null },
        draggedIds: ['wt-root', 'wt-other'],
        worktreeMap,
        folderIdByWorktree
      })
    ).toBe(false)
  })
})
