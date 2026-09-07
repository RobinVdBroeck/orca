import { describe, expect, it } from 'vitest'
import { worktree } from '../../worktree-list-groups-test-fixtures'
import {
  EMPTY_SIDEBAR_WORKTREE_FOLDER_MODEL,
  partitionWorktreesBySidebarFolder
} from './worktree-folder-sections'

const triage = { ...worktree, id: 'wt-triage', displayName: 'triage-1' }
const review = { ...worktree, id: 'wt-review', displayName: 'review-1' }
const root = { ...worktree, id: 'wt-root', displayName: 'root-1' }

const model = {
  foldersByRepoId: {
    'repo-1': [
      { id: 'f-reviews', name: 'reviews' },
      { id: 'f-triage', name: 'Triage' },
      { id: 'f-empty', name: 'empty' }
    ]
  },
  folderIdByWorktree: { 'wt-triage': 'f-triage', 'wt-review': 'f-reviews', 'wt-root': 'stale' }
}

describe('partitionWorktreesBySidebarFolder', () => {
  it('buckets members by folder, sorted by name, and leaves the rest at the root', () => {
    const result = partitionWorktreesBySidebarFolder([root, triage, review], ['repo-1'], model)
    expect(result.folders.map((section) => section.folder.name)).toEqual([
      'empty',
      'reviews',
      'Triage'
    ])
    expect(result.folders.map((section) => section.items.map((item) => item.id))).toEqual([
      [],
      ['wt-review'],
      ['wt-triage']
    ])
    // Why: a membership pointing at an unknown folder falls back to the root.
    expect(result.rootItems.map((item) => item.id)).toEqual(['wt-root'])
  })

  it('returns everything at the root when the project has no folders', () => {
    const result = partitionWorktreesBySidebarFolder(
      [triage, root],
      ['repo-1'],
      EMPTY_SIDEBAR_WORKTREE_FOLDER_MODEL
    )
    expect(result.folders).toEqual([])
    expect(result.rootItems.map((item) => item.id)).toEqual(['wt-triage', 'wt-root'])
  })

  it('only gathers folders of the section repos', () => {
    const result = partitionWorktreesBySidebarFolder([triage], ['repo-other'], model)
    expect(result.folders).toEqual([])
    expect(result.rootItems.map((item) => item.id)).toEqual(['wt-triage'])
  })
})
