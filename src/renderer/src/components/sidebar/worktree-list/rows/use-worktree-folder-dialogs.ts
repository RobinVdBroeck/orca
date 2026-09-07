import { useCallback, useState } from 'react'
import { useAppStore } from '@/store'
import type { Repo } from '../../../../../../shared/repo-types'
import type { WorktreeFolderHeaderInfo } from '../grouping/row-types'

export type WorktreeFolderNameDialogState =
  | { type: 'create'; repo: Repo }
  | { type: 'rename'; folderId: string; currentName: string }

export type WorktreeFolderDialogs = ReturnType<typeof useWorktreeFolderDialogs>

// Create/rename flows for sidebar worktree folders; delete needs no confirmation
// because members only fall back to the project root.
export function useWorktreeFolderDialogs() {
  const createSidebarWorktreeFolder = useAppStore((s) => s.createSidebarWorktreeFolder)
  const renameSidebarWorktreeFolder = useAppStore((s) => s.renameSidebarWorktreeFolder)
  const deleteSidebarWorktreeFolder = useAppStore((s) => s.deleteSidebarWorktreeFolder)
  const [nameDialog, setNameDialog] = useState<WorktreeFolderNameDialogState | null>(null)

  const handleCreateWorktreeFolder = useCallback((repo: Repo) => {
    setNameDialog({ type: 'create', repo })
  }, [])

  const handleRenameWorktreeFolder = useCallback((folder: WorktreeFolderHeaderInfo) => {
    setNameDialog({ type: 'rename', folderId: folder.id, currentName: folder.name })
  }, [])

  const handleDeleteWorktreeFolder = useCallback(
    (folder: WorktreeFolderHeaderInfo) => {
      deleteSidebarWorktreeFolder(folder.id)
    },
    [deleteSidebarWorktreeFolder]
  )

  const handleSubmitWorktreeFolderName = useCallback(
    (name: string) => {
      if (!nameDialog) {
        return
      }
      if (nameDialog.type === 'create') {
        createSidebarWorktreeFolder(nameDialog.repo.id, name)
        return
      }
      renameSidebarWorktreeFolder(nameDialog.folderId, name)
    },
    [createSidebarWorktreeFolder, nameDialog, renameSidebarWorktreeFolder]
  )

  return {
    nameDialog,
    setNameDialog,
    handleCreateWorktreeFolder,
    handleRenameWorktreeFolder,
    handleDeleteWorktreeFolder,
    handleSubmitWorktreeFolderName
  }
}
