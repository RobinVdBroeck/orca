import { useMemo } from 'react'
import type { WorkspaceStatusDefinition } from '../../../../../../shared/worktree/types'
import type { WorktreeDropCommitContext } from './drop-commit-context'
import type { useWorktreeDragRuntime } from './use-runtime'
import type { useWorktreeDragSession } from './use-session'
import type { useWorktreeLineageDropCommit } from './use-lineage-drop-commit'
import type { useWorktreeFolderDropCommit } from './use-folder-drop-commit'

/** Bundles the drag session, lineage/folder commits, and viewport callbacks every drop path reads. */
export function useWorktreeDropCommitContext(args: {
  scrollRef: React.RefObject<HTMLDivElement | null>
  workspaceStatuses: readonly WorkspaceStatusDefinition[]
  session: ReturnType<typeof useWorktreeDragSession>
  lineageDrop: ReturnType<typeof useWorktreeLineageDropCommit>
  folderDrop: ReturnType<typeof useWorktreeFolderDropCommit>
  runtime: ReturnType<typeof useWorktreeDragRuntime>
  onMoveWorktreesToStatus: WorktreeDropCommitContext['onMoveWorktreesToStatus']
  onMoveWorktreesToStatusAtIndex: WorktreeDropCommitContext['onMoveWorktreesToStatusAtIndex']
  onReorderWorktrees: WorktreeDropCommitContext['onReorderWorktrees']
  onPinWorktrees: WorktreeDropCommitContext['onPinWorktrees']
}): WorktreeDropCommitContext {
  const { scrollRef, workspaceStatuses, session, lineageDrop, folderDrop, runtime } = args
  const {
    onMoveWorktreesToStatus,
    onMoveWorktreesToStatusAtIndex,
    onReorderWorktrees,
    onPinWorktrees
  } = args
  const { getEligibleLineageDropTarget } = lineageDrop
  const { getEligibleFolderDropTarget } = folderDrop
  return useMemo<WorktreeDropCommitContext>(
    () => ({
      scrollRef,
      workspaceStatuses,
      worktreeDragGroups: session.worktreeDragGroups,
      worktreeDragUnitGroups: session.worktreeDragUnitGroups,
      computeWorktreeDrop: session.computeWorktreeDrop,
      computeWorktreeStatusDrop: session.computeWorktreeStatusDrop,
      refreshWorktreeDragSession: session.refreshWorktreeDragSession,
      getEligibleDropTarget: (target, draggedIds) =>
        getEligibleFolderDropTarget(getEligibleLineageDropTarget(target, draggedIds), draggedIds),
      commitWorktreeLineageParentDrop: lineageDrop.commitWorktreeLineageParentDrop,
      commitWorktreeFolderDrop: folderDrop.commitWorktreeFolderDrop,
      clearReorderedWorktreeParents: lineageDrop.clearReorderedWorktreeParents,
      clearWorktreeDrag: runtime.clearWorktreeDrag,
      onMoveWorktreesToStatus,
      onMoveWorktreesToStatusAtIndex,
      onReorderWorktrees,
      onPinWorktrees
    }),
    [
      folderDrop.commitWorktreeFolderDrop,
      getEligibleFolderDropTarget,
      getEligibleLineageDropTarget,
      lineageDrop.clearReorderedWorktreeParents,
      lineageDrop.commitWorktreeLineageParentDrop,
      onMoveWorktreesToStatus,
      onMoveWorktreesToStatusAtIndex,
      onPinWorktrees,
      onReorderWorktrees,
      runtime.clearWorktreeDrag,
      scrollRef,
      session.computeWorktreeDrop,
      session.computeWorktreeStatusDrop,
      session.refreshWorktreeDragSession,
      session.worktreeDragGroups,
      session.worktreeDragUnitGroups,
      workspaceStatuses
    ]
  )
}
