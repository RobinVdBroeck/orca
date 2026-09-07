/** A sidebar folder header (or a repo header, folderId null = project root) under a drag. */
export type WorktreeFolderDropTarget = {
  repoId: string
  folderId: string | null
}

export const WORKTREE_FOLDER_DROP_REPO_ID_ATTR = 'data-worktree-folder-drop-repo-id'
export const WORKTREE_FOLDER_DROP_FOLDER_ID_ATTR = 'data-worktree-folder-drop-folder-id'

export function getWorktreeFolderDropTargetKey(target: WorktreeFolderDropTarget): string {
  return target.folderId ?? `root:${target.repoId}`
}

export function readWorktreeFolderDropTarget(
  container: HTMLElement,
  target: Element
): WorktreeFolderDropTarget | null {
  const element = target.closest<HTMLElement>(`[${WORKTREE_FOLDER_DROP_REPO_ID_ATTR}]`)
  if (!element || !container.contains(element)) {
    return null
  }
  const repoId = element.getAttribute(WORKTREE_FOLDER_DROP_REPO_ID_ATTR)
  if (!repoId) {
    return null
  }
  return { repoId, folderId: element.getAttribute(WORKTREE_FOLDER_DROP_FOLDER_ID_ATTR) || null }
}
