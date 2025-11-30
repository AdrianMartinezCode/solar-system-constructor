import { useEffect } from 'react';
import { useSystemStore } from '../state/systemStore';
import { useWindowStore } from '../state/windowStore';

export const useKeyboardShortcuts = () => {
  const setTimeScale = useSystemStore((state) => state.setTimeScale);
  const timeScale = useSystemStore((state) => state.timeScale);
  const openWindow = useWindowStore((state) => state.openWindow);
  const closeWindow = useWindowStore((state) => state.closeWindow);
  const activeWindowId = useWindowStore((state) => state.activeWindowId);
  const windows = useWindowStore((state) => state.windows);
  const minimizeWindow = useWindowStore((state) => state.minimizeWindow);
  const focusWindow = useWindowStore((state) => state.focusWindow);
  const taskbarOrder = useWindowStore((state) => state.taskbarOrder);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Space - Pause/unpause
      if (e.code === 'Space') {
        e.preventDefault();
        setTimeScale(timeScale === 0 ? 1 : 0);
        return;
      }

      // Ctrl/Cmd + key shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'g':
          case 'G':
            e.preventDefault();
            openWindow('generator');
            break;
          case 'h':
          case 'H':
            e.preventDefault();
            openWindow('hierarchy');
            break;
          case 'o':
          case 'O':
            e.preventDefault();
            openWindow('overview');
            break;
          case 'e':
          case 'E':
            e.preventDefault();
            if (activeWindowId && windows[activeWindowId]?.type === 'planetEditor') {
              focusWindow(activeWindowId);
            } else {
              openWindow('planetEditor');
            }
            break;
          case 'w':
          case 'W':
            e.preventDefault();
            if (activeWindowId) {
              closeWindow(activeWindowId);
            }
            break;
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
            e.preventDefault();
            const index = parseInt(e.key) - 1;
            if (taskbarOrder[index]) {
              const windowId = taskbarOrder[index];
              const window = windows[windowId];
              if (window) {
                if (window.minimized) {
                  useWindowStore.getState().restoreWindow(windowId);
                } else {
                  focusWindow(windowId);
                }
              }
            }
            break;
        }
      }

      // Tab - Cycle through windows
      if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && taskbarOrder.length > 0) {
        e.preventDefault();
        const currentIndex = activeWindowId ? taskbarOrder.indexOf(activeWindowId) : -1;
        const nextIndex = (currentIndex + 1) % taskbarOrder.length;
        const nextWindowId = taskbarOrder[nextIndex];
        if (nextWindowId && windows[nextWindowId]) {
          if (windows[nextWindowId].minimized) {
            useWindowStore.getState().restoreWindow(nextWindowId);
          } else {
            focusWindow(nextWindowId);
          }
        }
      }

      // Shift + Tab - Cycle backwards
      if (e.key === 'Tab' && e.shiftKey && !e.ctrlKey && taskbarOrder.length > 0) {
        e.preventDefault();
        const currentIndex = activeWindowId ? taskbarOrder.indexOf(activeWindowId) : -1;
        const prevIndex = currentIndex <= 0 ? taskbarOrder.length - 1 : currentIndex - 1;
        const prevWindowId = taskbarOrder[prevIndex];
        if (prevWindowId && windows[prevWindowId]) {
          if (windows[prevWindowId].minimized) {
            useWindowStore.getState().restoreWindow(prevWindowId);
          } else {
            focusWindow(prevWindowId);
          }
        }
      }

      // Escape - Close active window or cancel
      if (e.key === 'Escape') {
        if (activeWindowId) {
          e.preventDefault();
          minimizeWindow(activeWindowId);
        }
      }

      // Single key shortcuts (without modifiers)
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 't':
            // Toggle time control expanded view (implemented in AppHeader)
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    timeScale,
    setTimeScale,
    openWindow,
    closeWindow,
    activeWindowId,
    windows,
    minimizeWindow,
    focusWindow,
    taskbarOrder,
  ]);
};

