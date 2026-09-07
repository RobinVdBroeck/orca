import { describe, expect, it } from 'vitest'
import type { UISlice } from './ui-slice-contract'
import { createUiWorktreeFolderActions } from './ui-slice-worktree-folder-actions'

type FolderSlice = Pick<
  UISlice,
  | 'sidebarWorktreeFoldersByRepoId'
  | 'sidebarWorktreeFolderIdByWorktree'
  | 'createSidebarWorktreeFolder'
  | 'renameSidebarWorktreeFolder'
  | 'deleteSidebarWorktreeFolder'
  | 'setSidebarWorktreeFolderForWorktrees'
>

function createHarness(): { state: () => FolderSlice } {
  let state = {} as FolderSlice
  const set = (updater: unknown): void => {
    const patch = typeof updater === 'function' ? updater(state) : updater
    state = { ...state, ...(patch as Partial<FolderSlice>) }
  }
  const get = (): FolderSlice => state
  state = createUiWorktreeFolderActions(set as never, get as never) as FolderSlice
  return { state: () => state }
}

describe('createUiWorktreeFolderActions', () => {
  it('creates a folder under its project and trims the name', () => {
    const { state } = createHarness()
    const folder = state().createSidebarWorktreeFolder('repo-1', '  triage ')
    expect(folder).toEqual({ id: expect.any(String), name: 'triage' })
    expect(state().sidebarWorktreeFoldersByRepoId).toEqual({ 'repo-1': [folder] })
    expect(state().createSidebarWorktreeFolder('repo-1', '   ')).toBeNull()
  })

  it('moves worktrees into a folder, back to the root, and ignores unknown folders', () => {
    const { state } = createHarness()
    const folder = state().createSidebarWorktreeFolder('repo-1', 'triage')!
    state().setSidebarWorktreeFolderForWorktrees(['wt-1', 'wt-2'], folder.id)
    expect(state().sidebarWorktreeFolderIdByWorktree).toEqual({
      'wt-1': folder.id,
      'wt-2': folder.id
    })
    state().setSidebarWorktreeFolderForWorktrees(['wt-1'], null)
    expect(state().sidebarWorktreeFolderIdByWorktree).toEqual({ 'wt-2': folder.id })
    const before = state().sidebarWorktreeFolderIdByWorktree
    state().setSidebarWorktreeFolderForWorktrees(['wt-3'], 'missing')
    expect(state().sidebarWorktreeFolderIdByWorktree).toBe(before)
  })

  it('renames in place', () => {
    const { state } = createHarness()
    const folder = state().createSidebarWorktreeFolder('repo-1', 'triage')!
    state().renameSidebarWorktreeFolder(folder.id, 'Triage queue')
    expect(state().sidebarWorktreeFoldersByRepoId['repo-1']).toEqual([
      { id: folder.id, name: 'Triage queue' }
    ])
  })

  it('deleting a folder drops it and returns members to the root', () => {
    const { state } = createHarness()
    const triage = state().createSidebarWorktreeFolder('repo-1', 'triage')!
    const reviews = state().createSidebarWorktreeFolder('repo-1', 'reviews')!
    state().setSidebarWorktreeFolderForWorktrees(['wt-1'], triage.id)
    state().setSidebarWorktreeFolderForWorktrees(['wt-2'], reviews.id)
    state().deleteSidebarWorktreeFolder(triage.id)
    expect(state().sidebarWorktreeFoldersByRepoId).toEqual({ 'repo-1': [reviews] })
    expect(state().sidebarWorktreeFolderIdByWorktree).toEqual({ 'wt-2': reviews.id })
    state().deleteSidebarWorktreeFolder(reviews.id)
    expect(state().sidebarWorktreeFoldersByRepoId).toEqual({})
  })
})
