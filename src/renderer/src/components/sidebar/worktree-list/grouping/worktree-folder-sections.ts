import type { Worktree } from '../../../../../../shared/worktree/types'
import {
  compareSidebarWorktreeFoldersByName,
  type SidebarWorktreeFolder,
  type SidebarWorktreeFolderIdByWorktree,
  type SidebarWorktreeFoldersByRepoId
} from '../../../../../../shared/sidebar-worktree-folders'

export type SidebarWorktreeFolderModel = {
  foldersByRepoId: SidebarWorktreeFoldersByRepoId
  folderIdByWorktree: SidebarWorktreeFolderIdByWorktree
}

export const EMPTY_SIDEBAR_WORKTREE_FOLDER_MODEL: SidebarWorktreeFolderModel = Object.freeze({
  foldersByRepoId: Object.freeze({}) as SidebarWorktreeFoldersByRepoId,
  folderIdByWorktree: Object.freeze({}) as SidebarWorktreeFolderIdByWorktree
})

export type WorktreeFolderSection = {
  folder: SidebarWorktreeFolder
  repoId: string
  items: Worktree[]
}

/**
 * Splits one repo section's worktrees into its folders (sorted by name, empty
 * ones included) and the rows left at the root. Members keep the incoming order.
 */
export function partitionWorktreesBySidebarFolder(
  items: readonly Worktree[],
  repoIds: Iterable<string>,
  model: SidebarWorktreeFolderModel
): { folders: WorktreeFolderSection[]; rootItems: Worktree[] } {
  const sections: WorktreeFolderSection[] = []
  const sectionByFolderId = new Map<string, WorktreeFolderSection>()
  for (const repoId of repoIds) {
    for (const folder of model.foldersByRepoId[repoId] ?? []) {
      if (sectionByFolderId.has(folder.id)) {
        continue
      }
      const section = { folder, repoId, items: [] }
      sectionByFolderId.set(folder.id, section)
      sections.push(section)
    }
  }
  if (sections.length === 0) {
    return { folders: [], rootItems: [...items] }
  }
  const rootItems: Worktree[] = []
  for (const worktree of items) {
    const folderId = model.folderIdByWorktree[worktree.id]
    const section = folderId ? sectionByFolderId.get(folderId) : undefined
    if (section) {
      section.items.push(worktree)
    } else {
      rootItems.push(worktree)
    }
  }
  sections.sort((left, right) => compareSidebarWorktreeFoldersByName(left.folder, right.folder))
  return { folders: sections, rootItems }
}
