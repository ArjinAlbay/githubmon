"use client";

import { useEffect } from "react";
import { useKanbanStore } from "@/stores/kanban";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export function GlobalShortcutHandler() {
  const setShowAddTaskModal = useKanbanStore((state) => state.setShowAddTaskModal);
  const toggleShowArchived = useKanbanStore((state) => state.toggleShowArchived);
  const syncFromGitHub = useKanbanStore((state) => state.syncFromGitHub);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA" ||
        (e.target as HTMLElement).isContentEditable;

      if (isInput) return;

      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        setShowAddTaskModal(true, "todo");
        
        if (!pathname.includes("/action-required")) {
          router.push("/action-required");
        }
        
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        if (pathname.includes("/action-required")) {
          const searchInput = document.querySelector<HTMLInputElement>('input[placeholder="Search tasks..."]');
          searchInput?.focus();
        } else {
          toast.info("Search is available on the Action Required page");
        }
        
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        if (!pathname.includes("/action-required")) {
          router.push("/action-required");
        }
        
        toast.promise(syncFromGitHub(), {
          loading: "Syncing from GitHub...",
          success: (result: { success: boolean; count?: number; error?: string }) => {
            if (result.success) {
              return `Synced ${result.count || 0} items from GitHub`;
            }
            return "Sync completed";
          },
          error: "Failed to sync from GitHub",
        });
        
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        if (!pathname.includes("/action-required")) {
          router.push("/action-required");
        }
        
        toggleShowArchived();
        
        return false;
      }

      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        
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
        
        return false;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true, passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [setShowAddTaskModal, toggleShowArchived, syncFromGitHub, router, pathname]);

  return null;
}
