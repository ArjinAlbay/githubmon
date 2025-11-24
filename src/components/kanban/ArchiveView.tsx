"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, RotateCcw, Trash2, ExternalLink, ArrowLeft } from "lucide-react";
import { useKanbanStore } from "@/stores/kanban";
import { toast } from "sonner";
import { sanitizeText } from "@/lib/sanitize";
import { useRouter } from "next/navigation";

export function ArchiveView() {
  const { archivedTasks, restoreTask, deleteArchivedTask, clearArchive } =
    useKanbanStore();
  const router = useRouter();

  const archivedTasksArray = Object.values(archivedTasks);

  if (archivedTasksArray.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Board
          </Button>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Archived Tasks (0)
          </h3>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Archive className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No archived tasks</p>
            <p className="text-sm text-muted-foreground mt-2">
              Tasks moved to archive will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRestore = (taskId: string) => {
    restoreTask(taskId);
    toast.success("Task restored to board");
    router.push("/dashboard");
  };

  const handleDelete = (taskId: string) => {
    if (confirm("Permanently delete this task? This cannot be undone.")) {
      deleteArchivedTask(taskId);
      toast.success("Task permanently deleted");
    }
  };

  const handleClearAll = () => {
    if (
      confirm(
        `Permanently delete all ${archivedTasksArray.length} archived tasks? This cannot be undone.`
      )
    ) {
      clearArchive();
      toast.success("Archive cleared");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Board
          </Button>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Archived Tasks ({archivedTasksArray.length})
          </h3>
        </div>
        {archivedTasksArray.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearAll}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Archive
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {archivedTasksArray.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-start gap-2">
                <span className="flex-1 line-clamp-2">
                  {sanitizeText(task.title)}
                </span>
                {task.githubUrl && (
                  <a
                    href={task.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-blue-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {sanitizeText(task.description)}
                </p>
              )}

              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  {task.type.replace("github-", "")}
                </Badge>
                <Badge
                  variant={
                    task.priority === "urgent" || task.priority === "high"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {task.priority}
                </Badge>
                {task.labels.slice(0, 2).map((label, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>

              {task.archivedAt && (
                <p className="text-xs text-muted-foreground">
                  Archived{" "}
                  {new Date(task.archivedAt).toLocaleDateString()}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => handleRestore(task.id)}
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(task.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
