import { useEffect } from 'react'
import type React from 'react'

// Fires onLifecycleComplete once the menu and every overlay it spawned have closed.
export function useWorktreeContextMenuLifecycle(args: {
  onLifecycleComplete: (() => void) | undefined
  menuOpen: boolean
  dialogsOpen: boolean
  createGroupDialogActiveRef: React.MutableRefObject<boolean>
  createFolderDialogActiveRef: React.MutableRefObject<boolean>
  parentPickerOpen: boolean
  pendingParentPickerRef: React.MutableRefObject<unknown>
  lifecycleStartedRef: React.MutableRefObject<boolean>
}): void {
  const {
    onLifecycleComplete,
    menuOpen,
    dialogsOpen,
    createGroupDialogActiveRef,
    createFolderDialogActiveRef,
    parentPickerOpen,
    pendingParentPickerRef,
    lifecycleStartedRef
  } = args
  useEffect(() => {
    if (!onLifecycleComplete) {
      return
    }
    if (menuOpen) {
      lifecycleStartedRef.current = true
    }
    const dialogActive = (): boolean =>
      createGroupDialogActiveRef.current || createFolderDialogActiveRef.current
    if (
      !lifecycleStartedRef.current ||
      menuOpen ||
      dialogsOpen ||
      dialogActive() ||
      parentPickerOpen ||
      pendingParentPickerRef.current !== null
    ) {
      return
    }
    const timer = window.setTimeout(() => {
      if (dialogActive() || pendingParentPickerRef.current !== null) {
        return
      }
      lifecycleStartedRef.current = false
      onLifecycleComplete()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [
    createFolderDialogActiveRef,
    createGroupDialogActiveRef,
    dialogsOpen,
    lifecycleStartedRef,
    menuOpen,
    onLifecycleComplete,
    parentPickerOpen,
    pendingParentPickerRef
  ])
}
