"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, ExternalLink, GripVertical, Trash2, Eye, RefreshCw, Settings, AlertTriangle, Keyboard } from "lucide-react";
import { useKanbanStore, KanbanTask } from "@/stores/kanban";
import { useState, useMemo, useEffect } from "react";
import { TaskDetailModal } from "./TaskDetailModal";
import { AddTaskModal } from "./AddTaskModal";
import { ColumnManagementModal } from "./ColumnManagementModal";
import { KanbanFilters } from "./KanbanFilters";
import { BulkActionsToolbar } from "./BulkActionsToolbar";
import { ArchiveView } from "./ArchiveView";
import { githubAPIClient } from "@/lib/api/github-api-client";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";
import { sanitizeText } from "@/lib/sanitize";
import { useKanbanShortcuts, showKeyboardShortcutsHelp } from "@/hooks/useKanbanShortcuts";

interface SortableTaskItemProps {
  task: KanbanTask;
  isDragging?: boolean;
  onDelete?: (taskId: string) => void;
  onView?: (task: KanbanTask) => void;
  onSelect?: (taskId: string) => void;
  isSelected?: boolean;
}

function SortableTaskItem({
  task,
  isDragging = false,
  onDelete,
  onView,
  onSelect,
  isSelected,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const getDueDateStatus = () => {
    if (!task.dueDate) return null;
    const now = new Date();
    const due = new Date(task.dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: "overdue", color: "text-red-600", text: "Overdue" };
    if (diffDays === 0) return { status: "today", color: "text-orange-600", text: "Today" };
    if (diffDays <= 3) return { status: "soon", color: "text-yellow-600", text: `${diffDays}d` };
    return { status: "normal", color: "text-muted-foreground", text: `${diffDays}d` };
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 border rounded bg-background cursor-pointer transition-all ${
        isDragging || isSortableDragging
          ? "shadow-lg"
          : "hover:shadow-md hover:border-primary/30"
      } ${dueDateStatus?.status === "overdue" ? "border-red-500/50" : ""} ${
        dueDateStatus?.status === "today" ? "border-orange-500/50" : ""
      } ${isSelected ? "ring-2 ring-primary" : ""}`}
      {...attributes}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('button, a, input')) {
          onView?.(task);
        }
      }}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-start gap-1 flex-1 min-w-0">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect?.(task.id)}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5"
          />
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            title="Drag to move"
          >
            <GripVertical className="w-3 h-3 text-muted-foreground" />
          </div>
          <h4 className="text-xs font-medium leading-tight flex-1 truncate">
            {sanitizeText(task.title)}
          </h4>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(task);
              }}
              className="text-muted-foreground hover:text-blue-600 p-0.5 transition-colors"
              title="View details"
            >
              <Eye className="w-3 h-3" />
            </button>
          )}
          {task.githubUrl && (
            <a
              href={task.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-blue-600 p-0.5 transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="Open on GitHub"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete this task?")) {
                  onDelete(task.id);
                  toast.success("Task deleted");
                }
              }}
              className="text-muted-foreground hover:text-red-600 p-0.5 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground mb-1 ml-4 line-clamp-1">
          {sanitizeText(task.description)}
        </p>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 ml-4 mb-1">
          {task.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
              {sanitizeText(tag)}
            </Badge>
          ))}
          {task.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              +{task.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      <div className="flex items-center justify-between ml-4">
        <div className="flex items-center gap-1">
          <Badge
            variant={
              task.priority === "urgent"
                ? "destructive"
                : task.priority === "high"
                ? "destructive"
                : task.priority === "medium"
                ? "default"
                : "secondary"
            }
            className="text-xs px-1 py-0"
          >
            {task.priority}
          </Badge>
          {dueDateStatus && (
            <span className={`text-xs font-medium ${dueDateStatus.color}`}>
              {dueDateStatus.text}
            </span>
          )}
        </div>

        <Badge variant="outline" className="text-xs px-1 py-0">
          {task.type.replace("github-", "")}
        </Badge>
      </div>
    </div>
  );
}

interface DroppableColumnProps {
  columnId: string;
  children: React.ReactNode;
}

function DroppableColumn({ columnId, children }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ id: columnId });

  return (
    <div ref={setNodeRef} className="min-h-80">
      {children}
    </div>
  );
}

export function KanbanBoard() {
  const {
    tasks,
    columns,
    columnOrder,
    moveTask,
    syncFromGitHub,
    deleteTask,
    showArchived,
    searchQuery,
    filterPriority,
    filterType,
    autoArchiveOldTasks,
    deduplicateAllColumns,
    showAddTaskModal,
    addTaskColumnId,
    setShowAddTaskModal,
  } = useKanbanStore();
  const { orgData } = useAuthStore();
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showColumnManagement, setShowColumnManagement] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closeOnGitHub, setCloseOnGitHub] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
    newIndex: number;
  } | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useKanbanShortcuts({
    onNewTask: () => {
      setShowAddTaskModal(true, "todo");
    },
    onSync: handleSyncFromGitHub,
    onSearch: () => {
      const searchInput = document.querySelector<HTMLInputElement>('input[placeholder="Search tasks..."]');
      searchInput?.focus();
    },
    onArchive: () => {
      useKanbanStore.getState().toggleShowArchived();
    },
    onHelp: showKeyboardShortcutsHelp,
  });

  useEffect(() => {
    deduplicateAllColumns();
  }, [deduplicateAllColumns]);

  const filteredTasks = useMemo(() => {
    const taskList = Object.values(tasks);
    return taskList.filter((task) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query);
        const matchesTags = task.tags?.some((tag) => tag.toLowerCase().includes(query));
        const matchesLabels = task.labels.some((label) => label.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDescription && !matchesTags && !matchesLabels) {
          return false;
        }
      }

      if (filterPriority !== "all" && task.priority !== filterPriority) {
        return false;
      }

      if (filterType !== "all" && task.type !== filterType) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, filterPriority, filterType]);

  const filteredTaskIds = useMemo(
    () => new Set(filteredTasks.map((t) => t.id)),
    [filteredTasks]
  );

  async function handleSyncFromGitHub() {
    setIsSyncing(true);
    try {
      const result = await syncFromGitHub();
      if (result.success) {
        if (result.count === 0) {
          toast.info("Already up to date", {
            description: "All GitHub items are already synced",
          });
        } else {
          toast.success(`Synced ${result.count} new tasks from GitHub`);
        }
      } else {
        toast.error("Sync failed", {
          description: result.error || "Unknown error",
        });
      }
    } catch (error) {
      toast.error("Sync failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSyncing(false);
    }
  }

  const handleAutoArchive = () => {
    const archived = autoArchiveOldTasks();
    if (archived > 0) {
      toast.success(`Auto-archived ${archived} old tasks from Done column`);
    } else {
      toast.info("No tasks to auto-archive");
    }
  };

  const handleTaskView = (task: KanbanTask) => {
    setSelectedTaskId(task.id);
    setIsModalOpen(true);
  };

  const handleTaskDelete = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks[active.id as string];
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !active) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    let sourceColumnId: string | null = null;
    Object.entries(columns).forEach(([columnId, column]) => {
      if (column.taskIds.includes(activeId)) {
        sourceColumnId = columnId;
      }
    });

    if (!sourceColumnId) return;

    let destinationColumnId: string | null = null;
    let destinationIndex = 0;

    if (columns[overId]) {
      destinationColumnId = overId;
      destinationIndex = 0;
    } else {
      Object.entries(columns).forEach(([columnId, column]) => {
        if (column.taskIds.includes(overId)) {
          destinationColumnId = columnId;
          const targetIndex = column.taskIds.indexOf(overId);
          if (sourceColumnId === destinationColumnId) {
            destinationIndex = targetIndex;
          } else {
            destinationIndex = targetIndex;
          }
        }
      });
    }

    if (!destinationColumnId) return;

    const task = tasks[activeId];
    const destColumn = columns[destinationColumnId];

    if (destColumn.wipLimit && destColumn.taskIds.length >= destColumn.wipLimit) {
      toast.warning("WIP Limit Reached", {
        description: `${destColumn.title} has reached its WIP limit of ${destColumn.wipLimit}`,
      });
      return;
    }

    if (
      destinationColumnId === "done" &&
      task &&
      (task.type === "github-issue" || task.type === "github-pr") &&
      task.githubUrl
    ) {
      setPendingMove({
        taskId: activeId,
        fromColumnId: sourceColumnId,
        toColumnId: destinationColumnId,
        newIndex: destinationIndex,
      });
      setShowCloseConfirm(true);
    } else {
      moveTask(activeId, sourceColumnId, destinationColumnId, destinationIndex);
      toast.success(`Moved to ${destColumn.title}`);
    }
  };

  const handleConfirmClose = async () => {
    if (!pendingMove) return;

    moveTask(
      pendingMove.taskId,
      pendingMove.fromColumnId,
      pendingMove.toColumnId,
      pendingMove.newIndex
    );

    if (closeOnGitHub && orgData?.token) {
      const task = tasks[pendingMove.taskId];
      if (task?.githubUrl) {
        setIsClosing(true);
        try {
          const urlParts = task.githubUrl.split("/");
          const owner = urlParts[urlParts.length - 4];
          const repo = urlParts[urlParts.length - 3];
          const number = parseInt(urlParts[urlParts.length - 1], 10);

          githubAPIClient.setUserToken(orgData.token);

          const result =
            task.type === "github-issue"
              ? await githubAPIClient.closeIssue(owner, repo, number)
              : await githubAPIClient.closePullRequest(owner, repo, number);

          if (result.success) {
            toast.success("Closed on GitHub");
          } else {
            toast.error(`Failed to close on GitHub: ${result.error}`);
          }
        } catch (error) {
          toast.error("Error closing on GitHub");
        } finally {
          setIsClosing(false);
        }
      }
    }

    setPendingMove(null);
    setShowCloseConfirm(false);
    setCloseOnGitHub(false);
  };

  const handleCancelClose = () => {
    setPendingMove(null);
    setShowCloseConfirm(false);
    setCloseOnGitHub(false);
  };

  if (showArchived) {
    return (
      <div className="space-y-4">
        <ArchiveView />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Development Tasks</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={showKeyboardShortcutsHelp}
            variant="ghost"
            size="sm"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleAutoArchive}
            variant="outline"
            size="sm"
            title="Auto-archive old tasks in Done column"
          >
            Auto-Archive
          </Button>
          <Button
            onClick={() => setShowColumnManagement(true)}
            variant="outline"
            size="sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Columns
          </Button>
          <Button
            onClick={handleSyncFromGitHub}
            variant="default"
            size="sm"
            disabled={isSyncing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync"}
          </Button>
        </div>
      </div>

      <KanbanFilters />

      <BulkActionsToolbar
        selectedTaskIds={selectedTaskIds}
        onClearSelection={() => setSelectedTaskIds(new Set())}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columnOrder.map((columnId) => {
            const column = columns[columnId];
            const columnTasks = column.taskIds
              .map((taskId) => tasks[taskId])
              .filter(Boolean)
              .filter((task) => filteredTaskIds.has(task.id));

            const wipWarning = column.wipLimit && columnTasks.length >= column.wipLimit;

            return (
              <Card key={columnId} className="w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                    {column.title}
                    <Badge variant="outline" className="ml-auto text-xs">
                      {columnTasks.length}
                    </Badge>
                    {column.wipLimit && (
                      <Badge
                        variant={wipWarning ? "destructive" : "secondary"}
                        className="text-xs"
                        title={`WIP Limit: ${column.wipLimit}`}
                      >
                        {wipWarning && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {columnTasks.length}/{column.wipLimit}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>

                <SortableContext
                  items={column.taskIds.filter((id) => filteredTaskIds.has(id))}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableColumn columnId={columnId}>
                    <CardContent className="space-y-2 min-h-60">
                      <div
                        className="h-2 w-full"
                        style={{
                          backgroundColor: "transparent",
                        }}
                      />
                      {columnTasks.map((task) => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          isDragging={activeTask?.id === task.id}
                          onView={handleTaskView}
                          onDelete={handleTaskDelete}
                          onSelect={handleTaskSelect}
                          isSelected={selectedTaskIds.has(task.id)}
                        />
                      ))}

                      <button
                        className="w-full p-2 border-2 border-dashed border-muted rounded hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary text-xs"
                        onClick={() => {
                          setShowAddTaskModal(true, column.id);
                        }}
                      >
                        <Plus className="w-3 h-3 mx-auto" />
                      </button>
                    </CardContent>
                  </DroppableColumn>
                </SortableContext>
              </Card>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="p-2 border rounded bg-background shadow-lg rotate-2 w-60">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-start gap-1 flex-1 min-w-0">
                  <GripVertical className="w-3 h-3 text-muted-foreground" />
                  <h4 className="text-xs font-medium leading-tight flex-1 truncate">
                    {sanitizeText(activeTask.title)}
                  </h4>
                </div>
                {activeTask.githubUrl && (
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              {activeTask.description && (
                <p className="text-xs text-muted-foreground mb-1 ml-4 line-clamp-1">
                  {sanitizeText(activeTask.description)}
                </p>
              )}
              <div className="flex items-center justify-between ml-4">
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {activeTask.priority}
                </Badge>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {activeTask.type.replace("github-", "")}
                </Badge>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailModal
        task={selectedTaskId ? tasks[selectedTaskId] : null}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTaskId(null);
        }}
      />

      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        columnId={addTaskColumnId}
      />

      <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Done</DialogTitle>
            <DialogDescription>
              This task is from GitHub. Would you like to close it on GitHub as
              well?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="close-github"
              checked={closeOnGitHub}
              onCheckedChange={(checked) =>
                setCloseOnGitHub(checked === true)
              }
            />
            <Label
              htmlFor="close-github"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Close this {pendingMove && tasks[pendingMove.taskId]?.type === "github-issue" ? "issue" : "PR"} on GitHub
            </Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirmClose} disabled={isClosing}>
              {isClosing ? "Closing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ColumnManagementModal
        isOpen={showColumnManagement}
        onClose={() => setShowColumnManagement(false)}
      />
    </div>
  );
}
