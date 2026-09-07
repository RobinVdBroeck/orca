import { Folder, FolderInput, FolderMinus } from 'lucide-react'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu'
import { translate } from '@/i18n/i18n'
import type { WorktreeContextMenuModel } from './use-worktree-context-menu-model'

/** "Move to folder" submenu of the worktree context menu; null when no project owns the row. */
export function WorktreeFolderMenuItems({
  model,
  disabled
}: {
  model: WorktreeContextMenuModel
  disabled: boolean
}) {
  if (!model.repo || !model.canMoveToWorktreeFolder) {
    return null
  }
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={disabled}>
        <FolderInput className="size-3.5" />
        {translate('auto.components.sidebar.WorktreeContextMenu.moveToFolder', 'Move to folder')}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {model.worktreeFolders.map((folder) => (
          <DropdownMenuItem
            key={folder.id}
            disabled={model.currentWorktreeFolderId === folder.id}
            onSelect={() => model.handleMoveToWorktreeFolder(folder.id)}
          >
            <Folder className="size-3.5" />
            <span className="max-w-48 truncate">{folder.name}</span>
          </DropdownMenuItem>
        ))}
        {model.worktreeFolders.length > 0 ? (
          <DropdownMenuItem
            disabled={model.currentWorktreeFolderId === null}
            onSelect={() => model.handleMoveToWorktreeFolder(null)}
          >
            <FolderMinus className="size-3.5" />
            {translate('auto.components.sidebar.WorktreeContextMenu.noFolder', 'No folder')}
          </DropdownMenuItem>
        ) : null}
        {model.worktreeFolders.length > 0 ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem onSelect={model.handleOpenCreateWorktreeFolderDialog}>
          {translate('auto.components.sidebar.WorktreeContextMenu.newFolder', 'New folder…')}
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
