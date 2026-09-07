import type { WorktreeStatus } from '@/lib/worktree-status'

// Most urgent first; a collapsed folder shows the highest-ranked member status.
const FOLDER_STATUS_PRIORITY: readonly WorktreeStatus[] = [
  'permission',
  'working',
  'monitoring',
  'interrupted',
  'done',
  'active',
  'inactive'
]

export function summarizeWorktreeFolderStatus(
  statuses: Iterable<WorktreeStatus>
): WorktreeStatus | null {
  let best: number | null = null
  for (const status of statuses) {
    const rank = FOLDER_STATUS_PRIORITY.indexOf(status)
    if (rank !== -1 && (best === null || rank < best)) {
      best = rank
    }
  }
  return best === null ? null : FOLDER_STATUS_PRIORITY[best]!
}
