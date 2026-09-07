import { describe, expect, it } from 'vitest'
import {
  compareSidebarWorktreeFoldersByName,
  findSidebarWorktreeFolderRepoId,
  normalizeSidebarWorktreeFolderIdByWorktree,
  normalizeSidebarWorktreeFoldersByRepoId
} from './sidebar-worktree-folders'

describe('normalizeSidebarWorktreeFoldersByRepoId', () => {
  it('keeps well-formed folders and trims names', () => {
    expect(
      normalizeSidebarWorktreeFoldersByRepoId({
        'repo-1': [
          { id: 'a', name: '  triage ' },
          { id: 'b', name: 'reviews' }
        ]
      })
    ).toEqual({
      'repo-1': [
        { id: 'a', name: 'triage' },
        { id: 'b', name: 'reviews' }
      ]
    })
  })

  it('drops malformed entries, duplicate ids, blank names and empty projects', () => {
    expect(
      normalizeSidebarWorktreeFoldersByRepoId({
        'repo-1': [
          { id: 'a', name: 'triage' },
          { id: 'a', name: 'dup' },
          { id: 'c', name: '  ' }
        ],
        'repo-2': 'nope',
        'repo-3': [{ name: 'no id' }, null],
        __proto__: [{ id: 'x', name: 'x' }]
      })
    ).toEqual({ 'repo-1': [{ id: 'a', name: 'triage' }] })
    expect(normalizeSidebarWorktreeFoldersByRepoId(null)).toEqual({})
    expect(normalizeSidebarWorktreeFoldersByRepoId([])).toEqual({})
  })
})

describe('normalizeSidebarWorktreeFolderIdByWorktree', () => {
  const folders = { 'repo-1': [{ id: 'a', name: 'triage' }] }

  it('keeps memberships that point at a known folder', () => {
    expect(
      normalizeSidebarWorktreeFolderIdByWorktree(
        { 'wt-1': 'a', 'wt-2': 'gone', 'wt-3': 1 },
        folders
      )
    ).toEqual({ 'wt-1': 'a' })
  })

  it('returns an empty record for non-record input', () => {
    expect(normalizeSidebarWorktreeFolderIdByWorktree('x', folders)).toEqual({})
  })
})

describe('findSidebarWorktreeFolderRepoId', () => {
  it('resolves the owning project or null', () => {
    const folders = { 'repo-1': [{ id: 'a', name: 'triage' }] }
    expect(findSidebarWorktreeFolderRepoId(folders, 'a')).toBe('repo-1')
    expect(findSidebarWorktreeFolderRepoId(folders, 'zzz')).toBeNull()
  })
})

describe('compareSidebarWorktreeFoldersByName', () => {
  it('sorts case-insensitively with numeric awareness', () => {
    const names = ['sprint 10', 'Reviews', 'sprint 2', 'features']
      .map((name, index) => ({ id: index.toString(10), name }))
      .sort(compareSidebarWorktreeFoldersByName)
      .map((folder) => folder.name)
    expect(names).toEqual(['features', 'Reviews', 'sprint 2', 'sprint 10'])
  })
})
