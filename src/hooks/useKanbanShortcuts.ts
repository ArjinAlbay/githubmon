import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useKanbanStore } from "@/stores/kanban";

interface ShortcutHandlers {
  onNewTask?: () => void;
  onSync?: () => void;
  onClear?: () => void;
  onSearch?: () => void;
  onArchive?: () => void;
  onHelp?: () => void;
}

export function useKanbanShortcuts(handlers: ShortcutHandlers) {
  const setShowAddTaskModal = useKanbanStore((state) => state.setShowAddTaskModal);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isInput =
      (e.target as HTMLElement).tagName === "INPUT" ||
      (e.target as HTMLElement).tagName === "TEXTAREA" ||
      (e.target as HTMLElement).isContentEditable;

    // Check for Alt+N to open new task modal - works globally
    if (e.altKey && e.key.toLowerCase() === "n" && !isInput) {
      console.log("⚡ Kanban: Alt+N detected, opening modal");
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Use global store function if no handler provided
      if (handlers.onNewTask) {
        handlers.onNewTask();
      } else {
        setShowAddTaskModal(true, "todo");
      }
      return false;
    }

    if ((e.ctrlKey || e.metaKey) && !isInput) {
      switch (e.key.toLowerCase()) {
        case "k":
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          handlers.onSearch?.();
          return false;
        case "r":
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          handlers.onSync?.();
          return false;
        case "l":
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          handlers.onClear?.();
          return false;
        case "e":
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          handlers.onArchive?.();
          return false;
      }
    }

    if (e.key === "?" && !isInput) {
      e.preventDefault();
      handlers.onHelp?.();
    }
  }, [handlers]);

  useEffect(() => {
    // Attach multiple listeners for maximum coverage
    // Use capture phase to intercept before any other handlers
    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [handleKeyDown]);
}

export function showKeyboardShortcutsHelp() {
  toast.info("Keyboard Shortcuts", {
    description: [
      "Alt+N - New task",
      "Ctrl+K - Search",
      "Ctrl+R - Sync from GitHub",
      "Ctrl+E - Toggle archive",
      "? - Show this help"
    ].join(" | "),
    duration: 8000,
  });
}
