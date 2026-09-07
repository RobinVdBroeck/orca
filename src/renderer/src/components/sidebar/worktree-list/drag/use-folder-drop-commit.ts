import { useCallback } from 'react'
import { useAppStore } from '@/store'
import type { Worktree } from '../../../../../../shared/worktree/types'
import type { SidebarWorktreeFolderIdByWorktree } from '../../../../../../shared/sidebar-worktree-folders'
import type { WorktreeFolderDropTarget } from '../../worktree-folder-drop-target'
import type { WorktreeSidebarLineageDropTarget } from './row-state'

export type WorktreeFolderDropCommit = ReturnType<typeof useWorktreeFolderDropCommit>

/** True when at least one dragged worktree belongs to the target's project and would move. */
export function isEligibleWorktreeFolderDrop(args: {
  target: WorktreeFolderDropTarget
  draggedIds: readonly string[]
  worktreeMap: ReadonlyMap<string, Worktree>
  folderIdByWorktree: SidebarWorktreeFolderIdByWorktree
}): boolean {
  return args.draggedIds.some((worktreeId) => {
    const worktree = args.worktreeMap.get(worktreeId)
    return (
      worktree?.repoId === args.target.repoId &&
      (args.folderIdByWorktree[worktreeId] ?? null) !== args.target.folderId
    )
  })
}

// Moving cards into a sidebar folder (or back to the project root) by drag.
export function useWorktreeFolderDropCommit(args: { worktreeMap: Map<string, Worktree> }) {
  const { worktreeMap } = args
  const folderIdByWorktree = useAppStore((s) => s.sidebarWorktreeFolderIdByWorktree)
  const setSidebarWorktreeFolderForWorktrees = useAppStore(
    (s) => s.setSidebarWorktreeFolderForWorktrees
  )

  const getEligibleFolderDropTarget = useCallback(
    (
      target: WorktreeSidebarLineageDropTarget,
      draggedIds: readonly string[]
    ): WorktreeSidebarLineageDropTarget => {
      if (
        !target.folderDrop ||
        isEligibleWorktreeFolderDrop({
          target: target.folderDrop,
          draggedIds,
          worktreeMap,
          folderIdByWorktree
        })
      ) {
        return target
      }
      return { ...target, folderDrop: null }
    },
    [folderIdByWorktree, worktreeMap]
  )

  const commitWorktreeFolderDrop = useCallback(
    (draggedIds: readonly string[], target: WorktreeFolderDropTarget): void => {
      // Why: a multi-select can span projects; only the target project's cards move.
      const movingIds = draggedIds.filter(
        (worktreeId) => worktreeMap.get(worktreeId)?.repoId === target.repoId
      )
      setSidebarWorktreeFolderForWorktrees(movingIds, target.folderId)
    },
    [setSidebarWorktreeFolderForWorktrees, worktreeMap]
  )

  return { getEligibleFolderDropTarget, commitWorktreeFolderDrop }
}
