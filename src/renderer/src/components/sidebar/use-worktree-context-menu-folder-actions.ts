import { useCallback, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/store'
import type { Repo } from '../../../../shared/repo-types'
import type { Worktree } from '../../../../shared/worktree/types'
import {
  compareSidebarWorktreeFoldersByName,
  type SidebarWorktreeFolder
} from '../../../../shared/sidebar-worktree-folders'

/** Mixed placement across a multi-selection; no folder entry is marked current. */
export const MIXED_WORKTREE_FOLDER_PLACEMENT = 'mixed'

// "Move to folder" for the worktree context menu; only same-project cards move.
export function useWorktreeContextMenuFolderActions(args: {
  activeContextWorktrees: readonly Worktree[]
  repo: Repo | null | undefined
}) {
  const { activeContextWorktrees, repo } = args
  const foldersByRepoId = useAppStore((s) => s.sidebarWorktreeFoldersByRepoId)
  const folderIdByWorktree = useAppStore((s) => s.sidebarWorktreeFolderIdByWorktree)
  const setSidebarWorktreeFolderForWorktrees = useAppStore(
    (s) => s.setSidebarWorktreeFolderForWorktrees
  )
  const createSidebarWorktreeFolder = useAppStore((s) => s.createSidebarWorktreeFolder)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const createFolderDialogActiveRef = useRef(false)
  const repoId = repo?.id ?? null

  const folderTargetIds = useMemo(
    () =>
      activeContextWorktrees
        .filter((worktree) => worktree.repoId === repoId)
        .map((worktree) => worktree.id),
    [activeContextWorktrees, repoId]
  )
  const worktreeFolders = useMemo<SidebarWorktreeFolder[]>(
    () =>
      repoId ? [...(foldersByRepoId[repoId] ?? [])].sort(compareSidebarWorktreeFoldersByName) : [],
    [foldersByRepoId, repoId]
  )
  const currentWorktreeFolderId = useMemo<string | null>(() => {
    const [first, ...rest] = folderTargetIds
    if (first === undefined) {
      return null
    }
    const folderId = folderIdByWorktree[first] ?? null
    return rest.every((worktreeId) => (folderIdByWorktree[worktreeId] ?? null) === folderId)
      ? folderId
      : MIXED_WORKTREE_FOLDER_PLACEMENT
  }, [folderIdByWorktree, folderTargetIds])

  const handleMoveToWorktreeFolder = useCallback(
    (folderId: string | null) => {
      setSidebarWorktreeFolderForWorktrees(folderTargetIds, folderId)
    },
    [folderTargetIds, setSidebarWorktreeFolderForWorktrees]
  )
  const handleOpenCreateWorktreeFolderDialog = useCallback(() => {
    createFolderDialogActiveRef.current = true
    setCreateFolderDialogOpen(true)
  }, [])
  const handleCreateWorktreeFolderDialogOpenChange = useCallback((open: boolean) => {
    createFolderDialogActiveRef.current = open
    setCreateFolderDialogOpen(open)
  }, [])
  const handleSubmitNewWorktreeFolder = useCallback(
    (name: string) => {
      if (!repoId) {
        return
      }
      const folder = createSidebarWorktreeFolder(repoId, name)
      if (folder) {
        setSidebarWorktreeFolderForWorktrees(folderTargetIds, folder.id)
      }
    },
    [createSidebarWorktreeFolder, folderTargetIds, repoId, setSidebarWorktreeFolderForWorktrees]
  )

  return {
    createFolderDialogActiveRef,
    createFolderDialogOpen,
    currentWorktreeFolderId,
    canMoveToWorktreeFolder: folderTargetIds.length > 0,
    handleCreateWorktreeFolderDialogOpenChange,
    handleMoveToWorktreeFolder,
    handleOpenCreateWorktreeFolderDialog,
    handleSubmitNewWorktreeFolder,
    worktreeFolders
  }
}
