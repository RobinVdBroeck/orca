import { describe, expect, it } from 'vitest'
import type { Worktree } from '../../../../../../shared/worktree/types'
import { buildRows } from './build-rows'
import { getWorktreeFolderGroupKey } from './group-keys'
import { getGroupKeysForWorktree } from './worktree-group-keys'
import type { SidebarWorktreeFolderModel } from './worktree-folder-sections'
import type { WorktreeGroupBy } from './row-types'
import { getWorktreeDragGroups } from '../drag/groups'
import { getWorktreeDragUnitGroups } from '../../worktree-drag-units'
import { addHostSectionRows } from '../../host-section-rows'
import { repo, repoMap, worktree } from '../../worktree-list-groups-test-fixtures'

const main: Worktree = { ...worktree, id: 'wt-main', displayName: 'main', isMainWorktree: true }
const triage: Worktree = { ...worktree, id: 'wt-triage', displayName: 'triage-1' }
const review: Worktree = { ...worktree, id: 'wt-review', displayName: 'review-1' }
const loose: Worktree = { ...worktree, id: 'wt-loose', displayName: 'loose' }

const folders: SidebarWorktreeFolderModel = {
  foldersByRepoId: {
    [repo.id]: [
      { id: 'f-triage', name: 'triage' },
      { id: 'f-reviews', name: 'reviews' }
    ]
  },
  folderIdByWorktree: { 'wt-triage': 'f-triage', 'wt-review': 'f-reviews' }
}

function build(args: {
  groupBy?: WorktreeGroupBy
  collapsed?: string[]
  model?: SidebarWorktreeFolderModel
}) {
  const worktrees = [triage, loose, review, main]
  return buildRows(
    args.groupBy ?? 'repo',
    worktrees,
    repoMap,
    null,
    new Set(args.collapsed ?? []),
    undefined,
    undefined,
    'manual',
    {},
    new Map(worktrees.map((item) => [item.id, item])),
    true,
    undefined,
    [],
    new Set(),
    new Map(),
    new Map(),
    [],
    undefined,
    [],
    undefined,
    'local',
    'single-location',
    args.model ?? folders
  )
}

function describeRows(rows: ReturnType<typeof buildRows>): string[] {
  return rows.map((row) =>
    row.type === 'header'
      ? `${row.worktreeFolder ? 'folder' : 'header'}:${row.key}`
      : row.type === 'item'
        ? `item:${row.worktree.id}@${row.sectionKey}/${row.groupDepth.toString(10)}`
        : row.type
  )
}

describe('buildRows with sidebar worktree folders', () => {
  it('emits folders (by name) before the root rows and keeps the main worktree first at the root', () => {
    expect(describeRows(build({}))).toEqual([
      'header:repo:repo-1',
      'folder:folder:f-reviews',
      'item:wt-review@folder:f-reviews/1',
      'folder:folder:f-triage',
      'item:wt-triage@folder:f-triage/1',
      'item:wt-main@repo:repo-1/0',
      'item:wt-loose@repo:repo-1/0'
    ])
  })

  it('describes the folder header with its members, depth and owning project', () => {
    const header = build({}).find(
      (row) => row.type === 'header' && row.worktreeFolder?.id === 'f-triage'
    )
    expect(header).toMatchObject({
      type: 'header',
      key: getWorktreeFolderGroupKey('f-triage'),
      label: 'triage',
      count: 1,
      projectGroupDepth: 1,
      worktreeIds: ['wt-triage'],
      worktreeFolder: { id: 'f-triage', name: 'triage', repoId: repo.id, repo }
    })
    const repoHeader = build({}).find((row) => row.type === 'header' && row.repo)
    expect(repoHeader).toMatchObject({ count: 4 })
  })

  it('hides members of a collapsed folder but keeps the folder header', () => {
    expect(describeRows(build({ collapsed: [getWorktreeFolderGroupKey('f-triage')] }))).toEqual([
      'header:repo:repo-1',
      'folder:folder:f-reviews',
      'item:wt-review@folder:f-reviews/1',
      'folder:folder:f-triage',
      'item:wt-main@repo:repo-1/0',
      'item:wt-loose@repo:repo-1/0'
    ])
  })

  it('ignores folders outside repo grouping', () => {
    const rows = build({ groupBy: 'workspace-status' })
    expect(rows.some((row) => row.type === 'header' && row.worktreeFolder)).toBe(false)
    expect(rows.filter((row) => row.type === 'item')).toHaveLength(4)
  })

  it('makes every folder its own drag group and keeps root rows in the repo group', () => {
    expect(getWorktreeDragGroups(build({}))).toEqual([
      { key: 'repo:repo-1', worktreeIds: ['wt-main', 'wt-loose'] },
      { key: 'folder:f-reviews', worktreeIds: ['wt-review'] },
      { key: 'folder:f-triage', worktreeIds: ['wt-triage'] }
    ])
    expect(getWorktreeDragUnitGroups(build({})).map((group) => group.key)).toEqual([
      'repo:repo-1',
      'folder:f-reviews',
      'folder:f-triage'
    ])
  })

  it('adds the folder key to the reveal group keys of a member', () => {
    expect(
      getGroupKeysForWorktree(
        'repo',
        triage,
        repoMap,
        null,
        undefined,
        undefined,
        [],
        undefined,
        folders.folderIdByWorktree
      )
    ).toEqual(['repo:repo-1', 'folder:f-triage'])
    expect(
      getGroupKeysForWorktree(
        'repo',
        loose,
        repoMap,
        null,
        undefined,
        undefined,
        [],
        undefined,
        folders.folderIdByWorktree
      )
    ).toEqual(['repo:repo-1'])
  })

  it('keeps a collapsed folder header inside its host section', () => {
    const rows = build({ collapsed: [getWorktreeFolderGroupKey('f-triage')] })
    const sectionRows = addHostSectionRows({
      rows,
      hostOptions: [
        { id: 'local', kind: 'local', label: 'Local', detail: '', health: 'local' },
        { id: 'ssh:gpu', kind: 'ssh', label: 'GPU', detail: '', health: 'available' }
      ],
      workspaceHostScope: 'all',
      visibleWorkspaceHostIds: ['local', 'ssh:gpu'],
      defaultHostId: 'local',
      preferProjectGrouping: false
    })
    // Why: a single populated host renders without host headers; the folder must not leak to the top.
    expect(sectionRows.map((row) => row.type)).toEqual(rows.map((row) => row.type))
  })
})
