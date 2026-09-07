// ─── Sidebar worktree folders ────────────────────────────────────────
// Client-side grouping of a project's worktrees under named folders in the
// sidebar. Independent of branch names and never sent to the execution host.

export type SidebarWorktreeFolder = {
  id: string
  name: string
}

/** Folders per project (repo id), in creation order; the sidebar sorts by name. */
export type SidebarWorktreeFoldersByRepoId = Record<string, SidebarWorktreeFolder[]>

/** Folder placement keyed by worktree id. Absent = project root. */
export type SidebarWorktreeFolderIdByWorktree = Record<string, string>

export const MAX_SIDEBAR_WORKTREE_FOLDER_NAME_LENGTH = 80

export function normalizeSidebarWorktreeFolderName(name: string): string {
  return name.trim().slice(0, MAX_SIDEBAR_WORKTREE_FOLDER_NAME_LENGTH)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isUnsafeRecordKey(key: string): boolean {
  return key === '__proto__' || key === 'constructor' || key === 'prototype'
}

export function normalizeSidebarWorktreeFoldersByRepoId(
  value: unknown
): SidebarWorktreeFoldersByRepoId {
  if (!isPlainRecord(value)) {
    return {}
  }
  const out: SidebarWorktreeFoldersByRepoId = {}
  const seenIds = new Set<string>()
  for (const [repoId, folders] of Object.entries(value)) {
    if (!repoId || isUnsafeRecordKey(repoId) || !Array.isArray(folders)) {
      continue
    }
    const normalized: SidebarWorktreeFolder[] = []
    for (const folder of folders) {
      if (
        !isPlainRecord(folder) ||
        typeof folder.id !== 'string' ||
        !folder.id ||
        typeof folder.name !== 'string' ||
        seenIds.has(folder.id)
      ) {
        continue
      }
      const name = normalizeSidebarWorktreeFolderName(folder.name)
      if (!name) {
        continue
      }
      seenIds.add(folder.id)
      normalized.push({ id: folder.id, name })
    }
    if (normalized.length > 0) {
      out[repoId] = normalized
    }
  }
  return out
}

/** Drops memberships that point at a folder no project owns. */
export function normalizeSidebarWorktreeFolderIdByWorktree(
  value: unknown,
  foldersByRepoId: SidebarWorktreeFoldersByRepoId
): SidebarWorktreeFolderIdByWorktree {
  if (!isPlainRecord(value)) {
    return {}
  }
  const knownFolderIds = new Set(
    Object.values(foldersByRepoId).flatMap((folders) => folders.map((folder) => folder.id))
  )
  const out: SidebarWorktreeFolderIdByWorktree = {}
  for (const [worktreeId, folderId] of Object.entries(value)) {
    if (
      !worktreeId ||
      isUnsafeRecordKey(worktreeId) ||
      typeof folderId !== 'string' ||
      !knownFolderIds.has(folderId)
    ) {
      continue
    }
    out[worktreeId] = folderId
  }
  return out
}

export function findSidebarWorktreeFolderRepoId(
  foldersByRepoId: SidebarWorktreeFoldersByRepoId,
  folderId: string
): string | null {
  for (const [repoId, folders] of Object.entries(foldersByRepoId)) {
    if (folders.some((folder) => folder.id === folderId)) {
      return repoId
    }
  }
  return null
}

export function compareSidebarWorktreeFoldersByName(
  left: SidebarWorktreeFolder,
  right: SidebarWorktreeFolder
): number {
  return left.name.localeCompare(right.name, undefined, { sensitivity: 'base', numeric: true })
}
