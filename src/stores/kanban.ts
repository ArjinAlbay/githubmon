import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useSettingsStore } from "./settings";
import { useActionItemsStore } from "./actionItems";
import type {
  ActionItem,
  AssignedItem,
  MentionItem,
  StalePR,
} from "./actionItems";

export interface TaskActivity {
  id: string;
  timestamp: Date;
  action: "created" | "updated" | "moved" | "archived" | "restored" | "deleted";
  userId?: string;
  details: string;
  fromColumn?: string;
  toColumn?: string;
}

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  type: "github-issue" | "github-pr" | "personal";
  priority: "low" | "medium" | "high" | "urgent";
  githubUrl?: string;
  labels: string[];
  tags?: string[];
  notes?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  sourceActionItemId?: string;
  archived?: boolean;
  archivedAt?: Date;
  activities?: TaskActivity[];
  timeEstimate?: number;
  timeSpent?: number;
  lastViewedAt?: Date;
}

type SerializedKanbanTask = Omit<
  KanbanTask,
  "createdAt" | "updatedAt" | "dueDate" | "archivedAt" | "lastViewedAt" | "activities"
> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  dueDate?: string | Date;
  archivedAt?: string | Date;
  lastViewedAt?: string | Date;
  activities?: Array<Omit<TaskActivity, "timestamp"> & { timestamp: string | Date }>;
};

interface GitHubItemWithExtras {
  id: string;
  title: string;
  type: "issue" | "pullRequest";
  url?: string;
  createdAt: string;
  updatedAt?: string;
  body?: string;
  labels?: Array<{ name: string }>;
  description?: string;
}

interface GitHubDataContext {
  assignedItems: AssignedItem[];
  mentionItems: MentionItem[];
  staleItems: StalePR[];
  currentTime: Date;
  userSettings: unknown;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  taskIds: string[];
  wipLimit?: number;
  collapsed?: boolean;
}

export interface ColumnSuggestion {
  id: string;
  title: string;
  color: string;
  priority: number;
  confidence: number;
  reason: string;
}

interface KanbanState {
  tasks: Record<string, KanbanTask>;
  columns: Record<string, KanbanColumn>;
  columnOrder: string[];
  addedActionItemIds: Set<string>;
  archivedTasks: Record<string, KanbanTask>;
  columnSuggestions: ColumnSuggestion[];
  searchQuery: string;
  filterPriority: string;
  filterType: string;
  showArchived: boolean;
  showAddTaskModal: boolean;
  addTaskColumnId: string;

  setShowAddTaskModal: (show: boolean, columnId?: string) => void;
  syncFromGitHub: () => Promise<{ success: boolean; count?: number; error?: string }>;
  addTask: (
    task: Omit<KanbanTask, "id" | "createdAt" | "updatedAt"> & {
      columnId?: string;
    }
  ) => string;
  addTaskFromActionItem: (
    item: ActionItem | AssignedItem | MentionItem | StalePR,
    notes?: string,
    columnId?: string
  ) => string;
  isActionItemAdded: (itemId: string) => boolean;
  removeActionItemFromKanban: (itemId: string) => void;
  updateTask: (id: string, updates: Partial<KanbanTask>) => void;
  moveTask: (
    taskId: string,
    fromColumnId: string,
    toColumnId: string,
    newIndex: number
  ) => void;
  deleteTask: (taskId: string) => void;
  archiveTask: (taskId: string) => void;
  restoreTask: (taskId: string) => void;
  deleteArchivedTask: (taskId: string) => void;
  clearArchive: () => void;
  clearGitHubTasks: () => void;
  addColumn: (title: string, color: string, wipLimit?: number) => void;
  updateColumn: (id: string, updates: Partial<KanbanColumn>) => void;
  deleteColumn: (id: string) => void;
  reorderColumns: (newOrder: string[]) => void;
  addActivity: (taskId: string, activity: Omit<TaskActivity, "id" | "timestamp">) => void;
  setSearchQuery: (query: string) => void;
  setFilterPriority: (priority: string) => void;
  setFilterType: (type: string) => void;
  toggleShowArchived: () => void;
  bulkArchive: (taskIds: string[]) => void;
  bulkDelete: (taskIds: string[]) => void;
  bulkMove: (taskIds: string[], toColumnId: string) => void;
  bulkUpdatePriority: (taskIds: string[], priority: KanbanTask["priority"]) => void;
  autoArchiveOldTasks: () => number;
  deduplicateAllColumns: () => Record<string, KanbanColumn>;
}

const defaultColumns: Record<string, KanbanColumn> = {
  todo: {
    id: "todo",
    title: "To Do",
    color: "#ef4444",
    taskIds: [],
  },
  "in-progress": {
    id: "in-progress",
    title: "In Progress",
    color: "#f59e0b",
    taskIds: [],
  },
  review: {
    id: "review",
    title: "Review",
    color: "#8b5cf6",
    taskIds: [],
  },
  done: {
    id: "done",
    title: "Done",
    color: "#10b981",
    taskIds: [],
  },
};

const analyzeContext = (context: GitHubDataContext): ColumnSuggestion[] => {
  const suggestions: ColumnSuggestion[] = [];

  const reviewCount = context.mentionItems.filter(
    (item) => "mentionType" in item && item.mentionType === "review_request"
  ).length;

  if (reviewCount >= 3) {
    suggestions.push({
      id: "urgent-reviews",
      title: "Code Reviews",
      color: "#dc2626",
      priority: 1,
      confidence: Math.min(reviewCount * 0.2, 1),
      reason: `You have ${reviewCount} pending code reviews`,
    });
  }

  const isMonday = context.currentTime.getDay() === 1;
  const weekendMentions = context.mentionItems.filter((item) => {
    const itemDate = new Date(item.createdAt || item.updatedAt);
    const dayOfWeek = itemDate.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  });

  if (isMonday && weekendMentions.length >= 2) {
    suggestions.push({
      id: "weekend-catchup",
      title: "Weekend Catchup",
      color: "#7c3aed",
      priority: 2,
      confidence: 0.8,
      reason: `${weekendMentions.length} items from the weekend need attention`,
    });
  }

  if (context.mentionItems.length >= 5) {
    suggestions.push({
      id: "mentions-focus",
      title: "Needs Response",
      color: "#2563eb",
      priority: 3,
      confidence: 0.7,
      reason: `${context.mentionItems.length} items where you're mentioned`,
    });
  }

  if (context.staleItems.length >= 3) {
    suggestions.push({
      id: "follow-up",
      title: "Follow Up",
      color: "#ea580c",
      priority: 4,
      confidence: 0.6,
      reason: `${context.staleItems.length} stale PRs need follow-up`,
    });
  }

  const urgentItems = [
    ...context.assignedItems,
    ...context.mentionItems,
  ].filter((item) => {
    const title = item.title?.toLowerCase() || "";
    const itemWithExtras = item as unknown as GitHubItemWithExtras;
    const body = itemWithExtras.body?.toLowerCase() || "";
    const labels =
      itemWithExtras.labels?.map((l: { name: string }) =>
        l.name.toLowerCase()
      ) || [];

    return (
      title.includes("urgent") ||
      title.includes("hotfix") ||
      title.includes("critical") ||
      body.includes("urgent") ||
      labels.some(
        (label: string) =>
          label.includes("urgent") ||
          label.includes("critical") ||
          label.includes("hotfix")
      )
    );
  });

  if (urgentItems.length >= 1) {
    suggestions.push({
      id: "emergency",
      title: "Emergency",
      color: "#dc2626",
      priority: 0,
      confidence: 1.0,
      reason: `${urgentItems.length} critical/urgent items detected`,
    });
  }

  return suggestions.sort((a, b) => a.priority - b.priority);
};

const MAX_COLUMNS = 8;
const MAX_TASKS_PER_BOARD = 500;
const AUTO_ARCHIVE_DAYS = 30;

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set, get) => ({
      tasks: {},
      columns: defaultColumns,
      columnOrder: ["todo", "in-progress", "review", "done"],
      addedActionItemIds: new Set<string>(),
      archivedTasks: {},
      columnSuggestions: [],
      searchQuery: "",
      filterPriority: "all",
      filterType: "all",
      showArchived: false,
      showAddTaskModal: false,
      addTaskColumnId: "todo",

      setShowAddTaskModal: (show: boolean, columnId?: string) => {
        set({ 
          showAddTaskModal: show,
          addTaskColumnId: columnId || get().addTaskColumnId || "todo"
        });
      },

      syncFromGitHub: async () => {
        try {
          const { githubSettings } = useSettingsStore.getState();
          const { assignedItems, mentionItems, staleItems } =
            useActionItemsStore.getState();

          const selectedItems: ActionItem[] = [];

          if (githubSettings.assignedToMe) {
            selectedItems.push(...assignedItems);
          }

          if (githubSettings.mentionsMe) {
            selectedItems.push(...mentionItems);
          }

          const uniqueSelected = Array.from(
            new Map(selectedItems.map((i) => [i.id, i])).values()
          );

          if (uniqueSelected.length === 0) {
            return { success: true, count: 0 };
          }

          const state = get();
          const alreadyAddedIds = state.addedActionItemIds;

          const newItems = uniqueSelected.filter(
            (item) => !alreadyAddedIds.has(item.id.toString())
          );

          if (newItems.length === 0) {
            return { success: true, count: 0 };
          }

          const contextData: GitHubDataContext = {
            assignedItems,
            mentionItems,
            staleItems,
            currentTime: new Date(),
            userSettings: githubSettings,
          };

          const contextSuggestions = analyzeContext(contextData);

          const newTasks: KanbanTask[] = newItems.map((item) => {
            const isReviewRequest =
              "mentionType" in item && item.mentionType === "review_request";
            const itemWithExtras = item as unknown as GitHubItemWithExtras;

            return {
              id: `action-${item.id}`,
              title: item.title,
              description: itemWithExtras.description?.substring(0, 200),
              type: item.type === "issue" ? "github-issue" : "github-pr",
              priority: isReviewRequest ? "high" : "medium",
              githubUrl: item.url,
              labels:
                itemWithExtras.labels?.map((l: { name: string }) => l.name) ||
                [],
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt || item.createdAt),
              sourceActionItemId: item.id.toString(),
              activities: [
                {
                  id: `activity-${Date.now()}-${Math.random()}`,
                  timestamp: new Date(),
                  action: "created",
                  details: "Synced from GitHub",
                },
              ],
            };
          });

          set((state) => {
            const existingTasks = { ...state.tasks };
            const updatedColumns = { ...state.columns };
            const newAddedIds = new Set(state.addedActionItemIds);

            newTasks.forEach((task) => {
              existingTasks[task.id] = task;
              newAddedIds.add(task.sourceActionItemId!);

              let targetColumn = "todo";

              if (task.type === "github-pr" && task.priority === "high") {
                targetColumn = "review";
              } else if (task.priority === "urgent") {
                targetColumn = "in-progress";
              }

              if (updatedColumns[targetColumn]) {
                const currentTaskIds = updatedColumns[targetColumn].taskIds;
                if (!currentTaskIds.includes(task.id)) {
                  updatedColumns[targetColumn] = {
                    ...updatedColumns[targetColumn],
                    taskIds: [...currentTaskIds, task.id],
                  };
                }
              }
            });

            return {
              tasks: existingTasks,
              columns: updatedColumns,
              addedActionItemIds: newAddedIds,
              columnSuggestions: contextSuggestions,
            };
          });

          return { success: true, count: newTasks.length };
        } catch (error) {
          console.error("Sync failed:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },

      addTask: (taskData) => {
        const state = get();
        const totalTasks = Object.keys(state.tasks).length;

        if (totalTasks >= MAX_TASKS_PER_BOARD) {
          throw new Error(`Maximum ${MAX_TASKS_PER_BOARD} tasks allowed. Please archive old tasks.`);
        }

        const { columnId, ...rest } = taskData;
        const id = `task-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const task: KanbanTask = {
          ...rest,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
          activities: [
            {
              id: `activity-${Date.now()}`,
              timestamp: new Date(),
              action: "created",
              details: "Task created manually",
            },
          ],
        };

        set((state) => {
          const targetColumn = columnId || "todo";
          const currentTaskIds = state.columns[targetColumn].taskIds;
          const updatedTaskIds = currentTaskIds.includes(id)
            ? currentTaskIds
            : [...currentTaskIds, id];
          return {
            tasks: { ...state.tasks, [id]: task },
            columns: {
              ...state.columns,
              [targetColumn]: {
                ...state.columns[targetColumn],
                taskIds: updatedTaskIds,
              },
            },
          };
        });

        return id;
      },

      addTaskFromActionItem: (item, notes, columnId = "todo") => {
        const id = `personal-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const task: KanbanTask = {
          id,
          title: item.title,
          description: `From: ${item.repo}${item.author ? ` (by ${item.author.login})` : ""}`,
          type: "personal",
          priority: item.priority,
          githubUrl: item.url,
          labels: item.labels?.map((l) => l.name) || [],
          notes,
          createdAt: new Date(),
          updatedAt: new Date(),
          sourceActionItemId: item.id.toString(),
          activities: [
            {
              id: `activity-${Date.now()}`,
              timestamp: new Date(),
              action: "created",
              details: `Added from action items (${item.repo})`,
            },
          ],
        };

        set((state) => {
          const newAddedIds = new Set(state.addedActionItemIds);
          newAddedIds.add(item.id.toString());
          const currentTaskIds = state.columns[columnId].taskIds;
          const updatedTaskIds = currentTaskIds.includes(id)
            ? currentTaskIds
            : [...currentTaskIds, id];
          return {
            tasks: { ...state.tasks, [id]: task },
            columns: {
              ...state.columns,
              [columnId]: {
                ...state.columns[columnId],
                taskIds: updatedTaskIds,
              },
            },
            addedActionItemIds: newAddedIds,
          };
        });
        return id;
      },

      isActionItemAdded: (itemId: string) => {
        return get().addedActionItemIds.has(itemId);
      },

      removeActionItemFromKanban: (itemId: string) => {
        set((state) => {
          const tasksToRemove = Object.entries(state.tasks)
            .filter(([, task]) => task.sourceActionItemId === itemId)
            .map(([id]) => id);

          const newTasks = { ...state.tasks };
          tasksToRemove.forEach((taskId) => {
            delete newTasks[taskId];
          });

          const newColumns = { ...state.columns };
          Object.keys(newColumns).forEach((columnId) => {
            newColumns[columnId] = {
              ...newColumns[columnId],
              taskIds: newColumns[columnId].taskIds.filter(
                (id) => !tasksToRemove.includes(id)
              ),
            };
          });

          const newAddedIds = new Set(state.addedActionItemIds);
          newAddedIds.delete(itemId);

          return {
            tasks: newTasks,
            columns: newColumns,
            addedActionItemIds: newAddedIds,
          };
        });
      },

      moveTask: (taskId, fromColumnId, toColumnId, newIndex) => {
        set((state) => {
          const fromColumn = state.columns[fromColumnId];
          const toColumn = state.columns[toColumnId];
          if (!fromColumn || !toColumn) return state;

          const task = state.tasks[taskId];
          if (!task) return state;

          const allColumnIds = Object.keys(state.columns);
          const cleanedColumns = { ...state.columns };

          allColumnIds.forEach((colId) => {
            if (colId !== toColumnId) {
              cleanedColumns[colId] = {
                ...cleanedColumns[colId],
                taskIds: cleanedColumns[colId].taskIds.filter((id) => id !== taskId),
              };
            }
          });

          const destTaskIds = cleanedColumns[toColumnId].taskIds.filter((id) => id !== taskId);
          const insertAt = Math.max(0, Math.min(newIndex, destTaskIds.length));
          destTaskIds.splice(insertAt, 0, taskId);

          cleanedColumns[toColumnId] = {
            ...cleanedColumns[toColumnId],
            taskIds: destTaskIds,
          };

          const updatedTask = {
            ...task,
            updatedAt: new Date(),
            activities: [
              ...(task.activities || []),
              {
                id: `activity-${Date.now()}`,
                timestamp: new Date(),
                action: "moved" as const,
                details: `Moved from ${fromColumn.title} to ${toColumn.title}`,
                fromColumn: fromColumnId,
                toColumn: toColumnId,
              },
            ],
          };

          return {
            tasks: {
              ...state.tasks,
              [taskId]: updatedTask,
            },
            columns: cleanedColumns,
          };
        });
      },

      updateTask: (id, updates) => {
        set((state) => {
          const task = state.tasks[id];
          if (!task) return state;

          return {
            tasks: {
              ...state.tasks,
              [id]: {
                ...task,
                ...updates,
                updatedAt: new Date(),
                activities: [
                  ...(task.activities || []),
                  {
                    id: `activity-${Date.now()}`,
                    timestamp: new Date(),
                    action: "updated",
                    details: "Task updated",
                  },
                ],
              },
            },
          };
        });
      },

      deleteTask: (taskId) => {
        set((state) => {
          const taskToDelete = state.tasks[taskId];
          const newTasks = { ...state.tasks };
          delete newTasks[taskId];

          const newColumns = { ...state.columns };
          Object.keys(newColumns).forEach((columnId) => {
            newColumns[columnId] = {
              ...newColumns[columnId],
              taskIds: newColumns[columnId].taskIds.filter(
                (id) => id !== taskId
              ),
            };
          });

          const newAddedIds = new Set(state.addedActionItemIds);
          if (taskToDelete?.sourceActionItemId) {
            newAddedIds.delete(taskToDelete.sourceActionItemId);
          }

          return {
            tasks: newTasks,
            columns: newColumns,
            addedActionItemIds: newAddedIds,
          };
        });
      },

      archiveTask: (taskId) => {
        set((state) => {
          const task = state.tasks[taskId];
          if (!task) return state;

          const archivedTask: KanbanTask = {
            ...task,
            archived: true,
            archivedAt: new Date(),
            activities: [
              ...(task.activities || []),
              {
                id: `activity-${Date.now()}`,
                timestamp: new Date(),
                action: "archived",
                details: "Task archived",
              },
            ],
          };

          const newTasks = { ...state.tasks };
          delete newTasks[taskId];

          const newColumns = { ...state.columns };
          Object.keys(newColumns).forEach((columnId) => {
            newColumns[columnId] = {
              ...newColumns[columnId],
              taskIds: newColumns[columnId].taskIds.filter(
                (id) => id !== taskId
              ),
            };
          });

          return {
            tasks: newTasks,
            columns: newColumns,
            archivedTasks: {
              ...state.archivedTasks,
              [taskId]: archivedTask,
            },
          };
        });
      },

      restoreTask: (taskId) => {
        set((state) => {
          const task = state.archivedTasks[taskId];
          if (!task) return state;

          const restoredTask: KanbanTask = {
            ...task,
            archived: false,
            archivedAt: undefined,
            activities: [
              ...(task.activities || []),
              {
                id: `activity-${Date.now()}`,
                timestamp: new Date(),
                action: "restored",
                details: "Task restored from archive",
              },
            ],
          };

          const newArchivedTasks = { ...state.archivedTasks };
          delete newArchivedTasks[taskId];

          const currentTodoTaskIds = state.columns.todo.taskIds;
          const updatedTodoTaskIds = currentTodoTaskIds.includes(taskId)
            ? currentTodoTaskIds
            : [...currentTodoTaskIds, taskId];

          return {
            tasks: {
              ...state.tasks,
              [taskId]: restoredTask,
            },
            columns: {
              ...state.columns,
              todo: {
                ...state.columns.todo,
                taskIds: updatedTodoTaskIds,
              },
            },
            archivedTasks: newArchivedTasks,
          };
        });
      },

      deleteArchivedTask: (taskId) => {
        set((state) => {
          const newArchivedTasks = { ...state.archivedTasks };
          delete newArchivedTasks[taskId];
          return { archivedTasks: newArchivedTasks };
        });
      },

      clearArchive: () => {
        set({ archivedTasks: {} });
      },

      clearGitHubTasks: () => {
        set((state) => {
          const personalTasks = Object.values(state.tasks)
            .filter((t) => t.type === "personal")
            .reduce((acc, task) => {
              acc[task.id] = task;
              return acc;
            }, {} as Record<string, KanbanTask>);

          const personalTaskIds = Object.keys(personalTasks);

          const resetColumns = Object.fromEntries(
            Object.entries(defaultColumns).map(([columnId, col]) => [
              columnId,
              {
                ...col,
                taskIds: personalTaskIds.filter(
                  (taskId) =>
                    state.columns[columnId]?.taskIds.includes(taskId) || false
                ),
              },
            ])
          ) as Record<string, KanbanColumn>;

          return {
            tasks: personalTasks,
            columns: resetColumns,
            columnOrder: ["todo", "in-progress", "review", "done"],
          };
        });
      },

      addColumn: (title, color, wipLimit) => {
        const state = get();
        if (Object.keys(state.columns).length >= MAX_COLUMNS) {
          throw new Error(`Maximum ${MAX_COLUMNS} columns allowed`);
        }

        const id = `column-${Date.now()}`;
        set((state) => ({
          columns: {
            ...state.columns,
            [id]: {
              id,
              title,
              color,
              taskIds: [],
              wipLimit,
            },
          },
          columnOrder: [...state.columnOrder, id],
        }));
      },

      updateColumn: (id, updates) => {
        set((state) => ({
          columns: {
            ...state.columns,
            [id]: {
              ...state.columns[id],
              ...updates,
            },
          },
        }));
      },

      deleteColumn: (id) => {
        set((state) => {
          const column = state.columns[id];
          if (!column) return state;

          const tasksToDelete = column.taskIds;
          const newTasks = { ...state.tasks };

          tasksToDelete.forEach((taskId) => {
            const task = newTasks[taskId];
            if (task?.sourceActionItemId) {
              const newAddedIds = new Set(state.addedActionItemIds);
              newAddedIds.delete(task.sourceActionItemId);
              state.addedActionItemIds = newAddedIds;
            }
            delete newTasks[taskId];
          });

          const newColumns = { ...state.columns };
          delete newColumns[id];

          return {
            tasks: newTasks,
            columns: newColumns,
            columnOrder: state.columnOrder.filter((colId) => colId !== id),
          };
        });
      },

      reorderColumns: (newOrder) => {
        set({ columnOrder: newOrder });
      },

      addActivity: (taskId, activity) => {
        set((state) => {
          const task = state.tasks[taskId];
          if (!task) return state;

          const newActivity: TaskActivity = {
            ...activity,
            id: `activity-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
          };

          return {
            tasks: {
              ...state.tasks,
              [taskId]: {
                ...task,
                activities: [...(task.activities || []), newActivity],
              },
            },
          };
        });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setFilterPriority: (priority) => {
        set({ filterPriority: priority });
      },

      setFilterType: (type) => {
        set({ filterType: type });
      },

      toggleShowArchived: () => {
        set((state) => ({ showArchived: !state.showArchived }));
      },

      bulkArchive: (taskIds) => {
        taskIds.forEach((taskId) => get().archiveTask(taskId));
      },

      bulkDelete: (taskIds) => {
        taskIds.forEach((taskId) => get().deleteTask(taskId));
      },

      bulkMove: (taskIds, toColumnId) => {
        set((state) => {
          const newTasks = { ...state.tasks };
          const newColumns = { ...state.columns };

          let fromColumnId = "";
          for (const columnId of Object.keys(newColumns)) {
            if (newColumns[columnId].taskIds.some((id) => taskIds.includes(id))) {
              fromColumnId = columnId;
              newColumns[columnId] = {
                ...newColumns[columnId],
                taskIds: newColumns[columnId].taskIds.filter(
                  (id) => !taskIds.includes(id)
                ),
              };
            }
          }

          if (newColumns[toColumnId]) {
            const currentTaskIds = newColumns[toColumnId].taskIds;
            const newTaskIds = taskIds.filter((id) => !currentTaskIds.includes(id));
            newColumns[toColumnId] = {
              ...newColumns[toColumnId],
              taskIds: [...currentTaskIds, ...newTaskIds],
            };
          }

          taskIds.forEach((taskId) => {
            const task = newTasks[taskId];
            if (task) {
              newTasks[taskId] = {
                ...task,
                updatedAt: new Date(),
                activities: [
                  ...(task.activities || []),
                  {
                    id: `activity-${Date.now()}-${taskId}`,
                    timestamp: new Date(),
                    action: "moved",
                    details: `Bulk moved to ${newColumns[toColumnId]?.title}`,
                    fromColumn: fromColumnId,
                    toColumn: toColumnId,
                  },
                ],
              };
            }
          });

          return { tasks: newTasks, columns: newColumns };
        });
      },

      bulkUpdatePriority: (taskIds, priority) => {
        set((state) => {
          const newTasks = { ...state.tasks };
          taskIds.forEach((taskId) => {
            const task = newTasks[taskId];
            if (task) {
              newTasks[taskId] = {
                ...task,
                priority,
                updatedAt: new Date(),
                activities: [
                  ...(task.activities || []),
                  {
                    id: `activity-${Date.now()}-${taskId}`,
                    timestamp: new Date(),
                    action: "updated",
                    details: `Priority changed to ${priority}`,
                  },
                ],
              };
            }
          });
          return { tasks: newTasks };
        });
      },

      autoArchiveOldTasks: () => {
        const state = get();
        const now = new Date();
        const doneColumn = state.columns.done;
        if (!doneColumn) return 0;

        let archived = 0;
        doneColumn.taskIds.forEach((taskId) => {
          const task = state.tasks[taskId];
          if (task) {
            const daysSinceUpdate = Math.floor(
              (now.getTime() - task.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSinceUpdate >= AUTO_ARCHIVE_DAYS) {
              get().archiveTask(taskId);
              archived++;
            }
          }
        });

        return archived;
      },

      deduplicateAllColumns: () => {
        set((state) => {
          const cleanedColumns = { ...state.columns };
          let totalDuplicatesRemoved = 0;

          Object.keys(cleanedColumns).forEach((columnId) => {
            const column = cleanedColumns[columnId];
            if (column?.taskIds) {
              const originalLength = column.taskIds.length;
              const uniqueTaskIds = [...new Set(column.taskIds)];
              const duplicatesRemoved = originalLength - uniqueTaskIds.length;

              if (duplicatesRemoved > 0) {
                totalDuplicatesRemoved += duplicatesRemoved;
                cleanedColumns[columnId] = {
                  ...column,
                  taskIds: uniqueTaskIds,
                };
              }
            }
          });

          if (totalDuplicatesRemoved > 0) {
            console.log(`Removed ${totalDuplicatesRemoved} duplicate task references`);
          }

          return { columns: cleanedColumns };
        });

        return get().columns;
      },
    }),
    {
      name: "githubmon-kanban",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return {
          getItem: (name: string) => {
            try {
              const item = localStorage.getItem(name);
              return item;
            } catch (error) {
              console.error("localStorage getItem error:", error);
              return null;
            }
          },
          setItem: (name: string, value: string) => {
            try {
              localStorage.setItem(name, value);
            } catch (error) {
              console.error("localStorage setItem error (quota exceeded?):", error);
            }
          },
          removeItem: (name: string) => {
            try {
              localStorage.removeItem(name);
            } catch (error) {
              console.error("localStorage removeItem error:", error);
            }
          },
        };
      }),
      partialize: (state) => ({
        tasks: state.tasks,
        columns: state.columns,
        columnOrder: state.columnOrder,
        addedActionItemIds: Array.from(state.addedActionItemIds),
        archivedTasks: state.archivedTasks,
        columnSuggestions: state.columnSuggestions,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        if (state.tasks) {
          for (const id of Object.keys(state.tasks)) {
            const t = state.tasks[id] as SerializedKanbanTask;
            if (t?.createdAt && typeof t.createdAt === "string")
              t.createdAt = new Date(t.createdAt);
            if (t?.updatedAt && typeof t.updatedAt === "string")
              t.updatedAt = new Date(t.updatedAt);
            if (t?.dueDate && typeof t.dueDate === "string")
              t.dueDate = new Date(t.dueDate);
            if (t?.archivedAt && typeof t.archivedAt === "string")
              t.archivedAt = new Date(t.archivedAt);
            if (t?.lastViewedAt && typeof t.lastViewedAt === "string")
              t.lastViewedAt = new Date(t.lastViewedAt);
            if (t?.activities) {
              t.activities = t.activities.map((a) => ({
                ...a,
                timestamp:
                  typeof a.timestamp === "string"
                    ? new Date(a.timestamp)
                    : a.timestamp,
              })) as TaskActivity[];
            }
          }
        }

        if (state.archivedTasks) {
          for (const id of Object.keys(state.archivedTasks)) {
            const t = state.archivedTasks[id] as SerializedKanbanTask;
            if (t?.createdAt && typeof t.createdAt === "string")
              t.createdAt = new Date(t.createdAt);
            if (t?.updatedAt && typeof t.updatedAt === "string")
              t.updatedAt = new Date(t.updatedAt);
            if (t?.dueDate && typeof t.dueDate === "string")
              t.dueDate = new Date(t.dueDate);
            if (t?.archivedAt && typeof t.archivedAt === "string")
              t.archivedAt = new Date(t.archivedAt);
            if (t?.activities) {
              t.activities = t.activities.map((a) => ({
                ...a,
                timestamp:
                  typeof a.timestamp === "string"
                    ? new Date(a.timestamp)
                    : a.timestamp,
              })) as TaskActivity[];
            }
          }
        }

        if (Array.isArray(state.addedActionItemIds)) {
          state.addedActionItemIds = new Set(state.addedActionItemIds);
        } else if (!state.addedActionItemIds) {
          state.addedActionItemIds = new Set();
        }

        if (state.columns) {
          Object.keys(state.columns).forEach((columnId) => {
            const column = state.columns[columnId];
            if (column?.taskIds) {
              const uniqueTaskIds = [...new Set(column.taskIds)];
              if (uniqueTaskIds.length !== column.taskIds.length) {
                console.warn(`Deduplicating column ${columnId}: ${column.taskIds.length} -> ${uniqueTaskIds.length}`);
                column.taskIds = uniqueTaskIds;
              }
            }
          });
        }
      },
    }
  )
);
