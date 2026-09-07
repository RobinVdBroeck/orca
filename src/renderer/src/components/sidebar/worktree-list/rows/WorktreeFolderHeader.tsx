import React from 'react'
import { ChevronDown, Ellipsis, Folder, FolderOpen } from 'lucide-react'
import type { VirtualItem } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import StatusIndicator from '../../StatusIndicator'
import { ProjectHeaderActions } from '../../ProjectHeaderActions'
import { REPO_HEADER_ACTION_BUTTON_CLASS } from '../../repo-header-action-button-class'
import {
  WORKTREE_FOLDER_DROP_FOLDER_ID_ATTR,
  WORKTREE_FOLDER_DROP_REPO_ID_ATTR
} from '../../worktree-folder-drop-target'
import { useWorktreeActivityStatuses } from '../../use-worktree-activity-statuses'
import type { GroupHeaderRow, WorktreeFolderHeaderInfo } from '../grouping/row-types'
import { getVirtualRowTransform } from '../viewport/virtual-rows'
import { getProjectGroupHeaderPaddingLeft } from './indentation'
import {
  handleRepoHeaderActionPointerDown,
  shouldIgnoreRepoHeaderToggle,
  stopRepoHeaderKeyboardToggle,
  stopRepoHeaderMenuEvent
} from './header-event-guards'
import { getWorktreeOptionId } from './option-dom'
import { summarizeWorktreeFolderStatus } from './worktree-folder-status'

export type WorktreeFolderHeaderRowContext = {
  collapsedGroups: Set<string>
  highlightedRevealRowKey: string | null
  folderDragOverKey: string | null
  toggleGroupWithScrollAnchor: (groupKey: string) => void
  onRenameWorktreeFolder: (folder: WorktreeFolderHeaderInfo) => void
  onDeleteWorktreeFolder: (folder: WorktreeFolderHeaderInfo) => void
}

const EMPTY_WORKTREE_IDS: readonly string[] = []

function WorktreeFolderHeaderMenu({
  folder,
  onRename,
  onDelete
}: {
  folder: WorktreeFolderHeaderInfo
  onRename: (folder: WorktreeFolderHeaderInfo) => void
  onDelete: (folder: WorktreeFolderHeaderInfo) => void
}): React.JSX.Element {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={REPO_HEADER_ACTION_BUTTON_CLASS}
          data-repo-header-action=""
          aria-label={translate(
            'auto.components.sidebar.WorktreeList.folderActionsFor',
            'Folder actions for {{value0}}',
            { value0: folder.name }
          )}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={stopRepoHeaderKeyboardToggle}
          onPointerDown={handleRepoHeaderActionPointerDown}
        >
          <Ellipsis className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={6}
        onPointerDown={stopRepoHeaderMenuEvent}
        onMouseDown={stopRepoHeaderMenuEvent}
        onPointerUp={stopRepoHeaderMenuEvent}
        onMouseUp={stopRepoHeaderMenuEvent}
        onClick={stopRepoHeaderMenuEvent}
        onKeyDown={stopRepoHeaderMenuEvent}
      >
        <DropdownMenuItem onSelect={() => onRename(folder)}>
          {translate('auto.components.sidebar.WorktreeList.renameFolder', 'Rename folder')}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(folder)}>
          {translate('auto.components.sidebar.WorktreeList.deleteFolder', 'Delete folder')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function WorktreeFolderHeader({
  ctx,
  row,
  folder
}: {
  ctx: WorktreeFolderHeaderRowContext
  row: GroupHeaderRow
  folder: WorktreeFolderHeaderInfo
}): React.JSX.Element {
  const collapsed = ctx.collapsedGroups.has(row.key)
  const memberIds = row.worktreeIds ?? EMPTY_WORKTREE_IDS
  const statuses = useWorktreeActivityStatuses(memberIds)
  const summaryStatus = collapsed ? summarizeWorktreeFolderStatus(statuses.values()) : null
  const isDropTarget = ctx.folderDragOverKey === folder.id
  const FolderIcon = collapsed ? Folder : FolderOpen
  const toggle = (): void => ctx.toggleGroupWithScrollAnchor(row.key)
  return (
    <div
      id={getWorktreeOptionId(row.key)}
      role="button"
      tabIndex={0}
      aria-expanded={!collapsed}
      {...{
        [WORKTREE_FOLDER_DROP_REPO_ID_ATTR]: folder.repoId,
        [WORKTREE_FOLDER_DROP_FOLDER_ID_ATTR]: folder.id
      }}
      className={cn(
        'group relative flex h-7 w-full cursor-pointer items-center gap-1.5 pr-2 text-left transition-all',
        ctx.highlightedRevealRowKey === row.key &&
          'rounded-md bg-worktree-sidebar-accent ring-1 ring-worktree-sidebar-ring/50',
        isDropTarget && 'rounded-md bg-worktree-sidebar-accent ring-1 ring-worktree-sidebar-ring/40'
      )}
      style={{ paddingLeft: getProjectGroupHeaderPaddingLeft(row.projectGroupDepth ?? 0) }}
      onClick={(event) => {
        if (!shouldIgnoreRepoHeaderToggle(event)) {
          toggle()
        }
      }}
      onKeyDown={(event) => {
        if (shouldIgnoreRepoHeaderToggle(event)) {
          return
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          toggle()
        }
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5 self-stretch">
        <div className={cn('flex size-4 shrink-0 items-center justify-center', row.tone)}>
          <FolderIcon className="size-3.5" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <div className="min-w-0 truncate text-[13px] font-medium leading-none">{row.label}</div>
          {summaryStatus && summaryStatus !== 'inactive' ? (
            <StatusIndicator status={summaryStatus} tooltipSide="right" />
          ) : null}
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {row.count.toString(10)}
          </span>
        </div>
      </div>
      <ProjectHeaderActions>
        <div
          className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
          data-repo-header-collapse-affordance=""
          aria-hidden
          onPointerDown={handleRepoHeaderActionPointerDown}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            toggle()
          }}
        >
          <ChevronDown className={cn('size-3.5 transition-transform', collapsed && '-rotate-90')} />
        </div>
        <WorktreeFolderHeaderMenu
          folder={folder}
          onRename={ctx.onRenameWorktreeFolder}
          onDelete={ctx.onDeleteWorktreeFolder}
        />
      </ProjectHeaderActions>
    </div>
  )
}

export function renderWorktreeFolderHeaderRow(args: {
  ctx: WorktreeFolderHeaderRowContext
  row: GroupHeaderRow
  folder: WorktreeFolderHeaderInfo
  vItem: VirtualItem
  hasHeaderTopSpacing: boolean
  measureVirtualRowElement: (element: HTMLDivElement | null) => void
}): React.JSX.Element {
  const { row, vItem } = args
  return (
    <div
      key={vItem.key}
      role="presentation"
      data-worktree-virtual-row
      data-worktree-virtual-row-key={String(vItem.key)}
      data-worktree-virtual-row-start={vItem.start}
      data-index={vItem.index}
      ref={args.measureVirtualRowElement}
      className={cn('absolute left-0 right-0 top-0', args.hasHeaderTopSpacing && 'pt-1')}
      style={{ transform: getVirtualRowTransform(vItem.start) }}
    >
      <WorktreeFolderHeader ctx={args.ctx} row={row} folder={args.folder} />
    </div>
  )
}
