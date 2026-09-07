import type { WorktreeDragGroup } from './worktree-manual-order'
import { ALL_GROUP_KEY, PINNED_GROUP_KEY } from './worktree-list/grouping/group-keys'
import { getNaturalWorktreeIds } from './natural-worktree-ids'

export type WorktreeDragUnitGroup = WorktreeDragGroup & {
  units: { worktreeId: string; worktreeIds: string[] }[]
}

type WorktreeDragUnitRow =
  | { type: 'host-header' }
  | { type: 'header'; key: string }
  | { type: 'item'; worktree: { id: string }; depth: number; sectionKey: string }
  | { type: 'imported-worktrees-card' }
  | { type: 'new-external-worktrees-inbox' }
  | { type: 'pending-creation' }
  | { type: 'folder-workspace' }

export function getWorktreeDragUnitGroups(
  rows: readonly WorktreeDragUnitRow[]
): WorktreeDragUnitGroup[] {
  const groups: WorktreeDragUnitGroup[] = []
  const unitsByKey = new Map<string, WorktreeDragUnitGroup['units']>()
  const naturalWorktreeIds = getNaturalWorktreeIds(rows)
  const ensureGroup = (key: string): WorktreeDragUnitGroup['units'] => {
    let units = unitsByKey.get(key)
    if (!units) {
      units = []
      unitsByKey.set(key, units)
      groups.push({ key, units, worktreeIds: [] })
    }
    return units
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
    const units = ensureGroup(row.sectionKey || ALL_GROUP_KEY)
    if (row.depth > 0 && units.length > 0) {
      units.at(-1)!.worktreeIds.push(row.worktree.id)
      continue
    }
    units.push({ worktreeId: row.worktree.id, worktreeIds: [row.worktree.id] })
  }

  return groups
    .map((group) => ({
      ...group,
      worktreeIds: group.units.map((unit) => unit.worktreeId)
    }))
    .filter((group) => group.worktreeIds.length > 0)
}

export function getFullDropIndexForWorktreeDragUnit(args: {
  groups: readonly WorktreeDragUnitGroup[]
  sourceGroupKey: string
  dropIndex: number
}): number {
  const group = args.groups.find((candidate) => candidate.key === args.sourceGroupKey)
  if (!group) {
    return args.dropIndex
  }
  const boundedDropIndex = Math.max(0, Math.min(group.units.length, args.dropIndex))
  let fullDropIndex = 0
  for (let index = 0; index < boundedDropIndex; index++) {
    fullDropIndex += group.units[index]?.worktreeIds.length ?? 0
  }
  return fullDropIndex
}
