import { ALL_GROUP_KEY, PINNED_GROUP_KEY } from '../grouping/group-keys'
import { getNaturalWorktreeIds } from '../../natural-worktree-ids'
import type { HostSectionRow } from '../../host-section-rows'
import type { WorktreeDragGroup } from '../../worktree-manual-order'

export function getWorktreeDragGroups(rows: HostSectionRow[]): WorktreeDragGroup[] {
  const groups: WorktreeDragGroup[] = []
  const idsByKey = new Map<string, string[]>()
  const naturalWorktreeIds = getNaturalWorktreeIds(rows)
  const ensureGroup = (key: string): string[] => {
    let ids = idsByKey.get(key)
    if (!ids) {
      ids = []
      idsByKey.set(key, ids)
      groups.push({ key, worktreeIds: ids })
    }
    return ids
  }

  for (const row of rows) {
    if (row.type === 'header') {
      ensureGroup(row.key)
      continue
    }
    if (row.type !== 'item') {
      continue
    }
    if (row.sectionKey === PINNED_GROUP_KEY && naturalWorktreeIds.has(row.worktree.id)) {
      continue
    }
    // Why: a repo section's root rows follow its folder headers, so "last header seen" is wrong.
    ensureGroup(row.sectionKey || ALL_GROUP_KEY).push(row.worktree.id)
  }

  return groups.filter((group) => group.worktreeIds.length > 0)
}

export function getWorktreeDragIndexes(rows: readonly HostSectionRow[]): {
  groupKeyByRowKey: Map<string, string>
  groupIndexByRowKey: Map<string, number>
} {
  const groupKeyByRowKey = new Map<string, string>()
  const groupIndexByRowKey = new Map<string, number>()
  const groupIndexes = new Map<string, number>()
  const naturalWorktreeIds = getNaturalWorktreeIds(rows)
  for (const row of rows) {
    if (row.type === 'header') {
      groupIndexes.set(row.key, 0)
      continue
    }
    if (row.type !== 'item') {
      continue
    }
    if (row.sectionKey === PINNED_GROUP_KEY && naturalWorktreeIds.has(row.worktree.id)) {
      continue
    }
    const index = groupIndexes.get(row.sectionKey) ?? 0
    groupKeyByRowKey.set(row.rowKey, row.sectionKey)
    groupIndexByRowKey.set(row.rowKey, index)
    groupIndexes.set(row.sectionKey, index + 1)
  }
  return { groupKeyByRowKey, groupIndexByRowKey }
}
