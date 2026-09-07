import type { UISlice, UISliceGet, UISliceSet } from './ui-slice-contract'
import {
  findSidebarWorktreeFolderRepoId,
  normalizeSidebarWorktreeFolderName,
  type SidebarWorktreeFolder,
  type SidebarWorktreeFolderIdByWorktree
} from '../../../../../shared/sidebar-worktree-folders'

function newFolderId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function withoutFolder(
  membership: SidebarWorktreeFolderIdByWorktree,
  folderId: string
): SidebarWorktreeFolderIdByWorktree {
  const next: SidebarWorktreeFolderIdByWorktree = {}
  for (const [worktreeId, memberFolderId] of Object.entries(membership)) {
    if (memberFolderId !== folderId) {
      next[worktreeId] = memberFolderId
    }
  }
  return next
}

// Sidebar folder CRUD. Bare set(): persistence rides the debounced UI writer.
export function createUiWorktreeFolderActions(set: UISliceSet, get: UISliceGet): Partial<UISlice> {
  return {
    sidebarWorktreeFoldersByRepoId: {},
    sidebarWorktreeFolderIdByWorktree: {},

    createSidebarWorktreeFolder: (repoId, rawName) => {
      const name = normalizeSidebarWorktreeFolderName(rawName)
      if (!repoId || !name) {
        return null
      }
      const folder: SidebarWorktreeFolder = { id: newFolderId(), name }
      set((s) => ({
        sidebarWorktreeFoldersByRepoId: {
          ...s.sidebarWorktreeFoldersByRepoId,
          [repoId]: [...(s.sidebarWorktreeFoldersByRepoId[repoId] ?? []), folder]
        }
      }))
      return folder
    },

    renameSidebarWorktreeFolder: (folderId, rawName) => {
      const name = normalizeSidebarWorktreeFolderName(rawName)
      const repoId = findSidebarWorktreeFolderRepoId(get().sidebarWorktreeFoldersByRepoId, folderId)
      if (!name || !repoId) {
        return
      }
      set((s) => ({
        sidebarWorktreeFoldersByRepoId: {
          ...s.sidebarWorktreeFoldersByRepoId,
          [repoId]: (s.sidebarWorktreeFoldersByRepoId[repoId] ?? []).map((folder) =>
            folder.id === folderId ? { ...folder, name } : folder
          )
        }
      }))
    },

    deleteSidebarWorktreeFolder: (folderId) => {
      const repoId = findSidebarWorktreeFolderRepoId(get().sidebarWorktreeFoldersByRepoId, folderId)
      if (!repoId) {
        return
      }
      set((s) => {
        const remaining = (s.sidebarWorktreeFoldersByRepoId[repoId] ?? []).filter(
          (folder) => folder.id !== folderId
        )
        const foldersByRepoId = { ...s.sidebarWorktreeFoldersByRepoId }
        if (remaining.length > 0) {
          foldersByRepoId[repoId] = remaining
        } else {
          delete foldersByRepoId[repoId]
        }
        return {
          sidebarWorktreeFoldersByRepoId: foldersByRepoId,
          sidebarWorktreeFolderIdByWorktree: withoutFolder(
            s.sidebarWorktreeFolderIdByWorktree,
            folderId
          )
        }
      })
    },

    setSidebarWorktreeFolderForWorktrees: (worktreeIds, folderId) => {
      if (worktreeIds.length === 0) {
        return
      }
      if (
        folderId !== null &&
        !findSidebarWorktreeFolderRepoId(get().sidebarWorktreeFoldersByRepoId, folderId)
      ) {
        return
      }
      set((s) => {
        const next = { ...s.sidebarWorktreeFolderIdByWorktree }
        let changed = false
        for (const worktreeId of worktreeIds) {
          if ((next[worktreeId] ?? null) === folderId) {
            continue
          }
          changed = true
          if (folderId === null) {
            delete next[worktreeId]
          } else {
            next[worktreeId] = folderId
          }
        }
        return changed ? { sidebarWorktreeFolderIdByWorktree: next } : {}
      })
    }
  }
}
