"use client";

import { useKanbanStore } from "@/stores/kanban";
import { AddTaskModal } from "@/components/kanban/AddTaskModal";

export function GlobalModalProvider() {
  const showAddTaskModal = useKanbanStore((state) => state.showAddTaskModal);
  const addTaskColumnId = useKanbanStore((state) => state.addTaskColumnId);
  const setShowAddTaskModal = useKanbanStore((state) => state.setShowAddTaskModal);

  return (
    <>
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        columnId={addTaskColumnId || "todo"}
      />
    </>
  );
}
