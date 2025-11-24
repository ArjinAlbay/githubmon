"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Archive,
  Trash2,
  MoveRight,
  AlertTriangle,
  X,
} from "lucide-react";
import { useKanbanStore } from "@/stores/kanban";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { KanbanTask } from "@/stores/kanban";

interface BulkActionsToolbarProps {
  selectedTaskIds: Set<string>;
  onClearSelection: () => void;
}

export function BulkActionsToolbar({
  selectedTaskIds,
  onClearSelection,
}: BulkActionsToolbarProps) {
  const {
    bulkArchive,
    bulkDelete,
    bulkMove,
    bulkUpdatePriority,
    columns,
    columnOrder,
  } = useKanbanStore();
  const router = useRouter();

  if (selectedTaskIds.size === 0) return null;

  const handleBulkArchive = () => {
    const count = selectedTaskIds.size;
    if (confirm(`Archive ${count} task(s)?`)) {
      bulkArchive(Array.from(selectedTaskIds));
      onClearSelection();
      toast.success(`Archived ${count} task(s)`);
      router.push("/dashboard/archive");
    }
  };

  const handleBulkDelete = () => {
    const count = selectedTaskIds.size;
    if (
      confirm(
        `Permanently delete ${count} task(s)? This action cannot be undone.`
      )
    ) {
      bulkDelete(Array.from(selectedTaskIds));
      onClearSelection();
      toast.success(`Deleted ${count} task(s)`);
    }
  };

  const handleBulkMove = (columnId: string) => {
    const count = selectedTaskIds.size;
    const column = columns[columnId];
    bulkMove(Array.from(selectedTaskIds), columnId);
    onClearSelection();
    toast.success(`Moved ${count} task(s) to ${column.title}`);
  };

  const handleBulkPriority = (priority: KanbanTask["priority"]) => {
    const count = selectedTaskIds.size;
    bulkUpdatePriority(Array.from(selectedTaskIds), priority);
    onClearSelection();
    toast.success(`Updated priority for ${count} task(s)`);
  };

  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 p-3 bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-lg">
      <Badge variant="secondary" className="gap-1">
        <AlertTriangle className="w-3 h-3" />
        {selectedTaskIds.size} selected
      </Badge>

      <Select onValueChange={handleBulkMove}>
        <SelectTrigger className="w-[180px] h-9">
          <MoveRight className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Move to..." />
        </SelectTrigger>
        <SelectContent>
          {columnOrder.map((columnId) => {
            const column = columns[columnId];
            return (
              <SelectItem key={columnId} value={columnId}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  {column.title}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <Select onValueChange={handleBulkPriority}>
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue placeholder="Set priority..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="urgent">🔴 Urgent</SelectItem>
          <SelectItem value="high">🟠 High</SelectItem>
          <SelectItem value="medium">🟡 Medium</SelectItem>
          <SelectItem value="low">🟢 Low</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex-1" />

      <Button
        variant="outline"
        size="sm"
        onClick={handleBulkArchive}
        className="gap-2"
      >
        <Archive className="w-4 h-4" />
        Archive
      </Button>

      <Button
        variant="destructive"
        size="sm"
        onClick={handleBulkDelete}
        className="gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>

      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
