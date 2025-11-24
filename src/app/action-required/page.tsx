"use client";

import { useEffect, Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserHoverCard } from "@/components/ui/user-hover-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRequireAuth } from "@/hooks/useAuth";
import {
  Target,
  MessageSquare,
  Clock,
  Zap,
  ExternalLink,
  RefreshCw,
  LucideIcon,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { useActionItemsStore, useKanbanStore, useDetailPanelStore } from "@/stores";
import type { ActionItem as StoreActionItem } from "@/stores/actionItems";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchModal } from "@/components/search/SearchModal";
import { QuickActionsMenu } from "@/components/action-required/QuickActionsMenu";
import { DetailPanel } from "@/components/ui/detail-panel";
import { NewIssueDialog } from "@/components/action-required/NewIssueDialog";
import { useActionRequiredFilters } from "@/hooks/useFilters";
import { ActionRequiredFiltersPanel } from "@/components/filters/ActionRequiredFiltersPanel";

interface ActionItem {
  id: string | number;
  title: string;
  url?: string;
  repo: string;
  type: string;
  author: {
    login: string;
    avatarUrl: string;
  };
  labels: Array<{ name: string; color?: string }>;
  priority: "urgent" | "high" | "medium" | "low";
  daysOld?: number;
  updatedAt: string;
  comments?: number;
  stars?: number;
  additions?: number;
  deletions?: number;
  language?: string;
  mergeable?: "MERGEABLE" | "CONFLICTING" | "UNKNOWN";
  statusCheckRollup?: {
    state: "SUCCESS" | "FAILURE" | "PENDING" | "EXPECTED";
  };
}

const VALID_TABS = ["all", "assigned", "mentions", "stale"] as const;
type ValidTab = (typeof VALID_TABS)[number];

function extractIssueNumber(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/\/(issues|pull)\/(\d+)/);
  return match ? match[2] : null;
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
}

function getStaleRowClassName(daysOld: number | undefined): string {
  if (!daysOld) return "";

  if (daysOld > 14) {
    return "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30";
  }

  if (daysOld > 7) {
    return "bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/30";
  }

  return "";
}

function ActionRequiredContent() {
  const {
    assignedItems,
    mentionItems,
    staleItems,
    loading,
    errors,
    refreshData,
  } = useActionItemsStore();

  const { selectedIssue, isOpen, closePanel } = useDetailPanelStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isNewIssueOpen, setIsNewIssueOpen] = useState(false);
  
  const { filters, updateFilters, resetFilters, hasActiveFilters } = useActionRequiredFilters();

  const tabParam = searchParams?.get("tab");
  const currentTab: ValidTab = VALID_TABS.includes(tabParam as ValidTab)
    ? (tabParam as ValidTab)
    : "all";

  const STALE_THRESHOLD = 5 * 60 * 1000;

  const refreshActiveTab = useCallback((tabType: ValidTab) => {
    if (tabType === "all") {
      ["assigned", "mentions", "stale"].forEach((type) => {
        refreshData(type as "assigned" | "mentions" | "stale").catch((error) => {
          console.error(`Failed to refresh ${type} items:`, error);
        });
      });
    } else {
      refreshData(tabType).catch((error) => {
        console.error(`Failed to refresh ${tabType} items:`, error);
      });
    }
  }, [refreshData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsNewIssueOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (currentTab === "all") {
      const lastRefreshes = useActionItemsStore.getState().lastRefresh;
      const needsRefresh = ["assigned", "mentions", "stale"].some((type) => {
        const lastRefresh = lastRefreshes[type as keyof typeof lastRefreshes];
        return !lastRefresh || Date.now() - lastRefresh > STALE_THRESHOLD;
      });

      if (needsRefresh) {
        ["assigned", "mentions", "stale"].forEach((type) => {
          refreshData(type as "assigned" | "mentions" | "stale").catch((error) => {
            console.error(`Failed to refresh ${type} items:`, error);
          });
        });
      }
    } else {
      const lastRefresh = useActionItemsStore.getState().lastRefresh[currentTab];

      if (!lastRefresh || Date.now() - lastRefresh > STALE_THRESHOLD) {
        refreshActiveTab(currentTab);
      }
    }
  }, [currentTab, refreshActiveTab, refreshData, STALE_THRESHOLD]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (currentTab === "all") {
          const lastRefreshes = useActionItemsStore.getState().lastRefresh;
          const needsRefresh = ["assigned", "mentions", "stale"].some((type) => {
            const lastRefresh = lastRefreshes[type as keyof typeof lastRefreshes];
            return !lastRefresh || Date.now() - lastRefresh > STALE_THRESHOLD;
          });

          if (needsRefresh) {
            ["assigned", "mentions", "stale"].forEach((type) => {
              refreshData(type as "assigned" | "mentions" | "stale").catch((error) => {
                console.error(`Failed to refresh ${type} items:`, error);
              });
            });
          }
        } else {
          const lastRefresh = useActionItemsStore.getState().lastRefresh[currentTab];

          if (!lastRefresh || Date.now() - lastRefresh > STALE_THRESHOLD) {
            refreshActiveTab(currentTab);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentTab, refreshActiveTab, refreshData, STALE_THRESHOLD]);

  const applyFilters = useCallback((items: ActionItem[]) => {
    return items.filter((item) => {
      if (filters.assignee.length > 0) {
        const assigneeLogin = item.author?.login;
        if (!assigneeLogin || !filters.assignee.includes(assigneeLogin)) {
          return false;
        }
      }

      if (filters.repository.length > 0 && !filters.repository.includes(item.repo)) {
        return false;
      }

      if (filters.labels.length > 0) {
        const itemLabels = item.labels.map(l => l.name);
        const hasMatchingLabel = filters.labels.some(label => itemLabels.includes(label));
        if (!hasMatchingLabel) {
          return false;
        }
      }

      if (filters.type.length > 0 && !filters.type.includes(item.type as "issue" | "pullRequest")) {
        return false;
      }

      if (filters.staleness !== null && filters.staleness > 0) {
        if (!item.daysOld || item.daysOld < filters.staleness) {
          return false;
        }
      }

      if (filters.language.length > 0) {
        if (!item.language || !filters.language.includes(item.language)) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  const actionItemsByType = useMemo(
    () => {
      const allItems = [...assignedItems, ...mentionItems, ...staleItems];
      return {
        all: applyFilters(allItems),
        assigned: applyFilters(assignedItems),
        mentions: applyFilters(mentionItems),
        stale: applyFilters(staleItems),
      };
    },
    [assignedItems, mentionItems, staleItems, applyFilters]
  );

  const itemCounts = useMemo(
    () => ({
      all: actionItemsByType.all.length,
      assigned: actionItemsByType.assigned.length,
      mentions: actionItemsByType.mentions.length,
      stale: actionItemsByType.stale.length,
    }),
    [actionItemsByType]
  );

  const availableFilterOptions = useMemo(() => {
    const allItems = [...assignedItems, ...mentionItems, ...staleItems];
    
    const assignees = new Set<string>();
    const repositories = new Set<string>();
    const labels: Array<{ name: string; color?: string }> = [];
    const labelSet = new Set<string>();
    const languages = new Set<string>();

    allItems.forEach((item) => {
      if (item.author?.login) assignees.add(item.author.login);
      if (item.repo) repositories.add(item.repo);
      if (item.language) languages.add(item.language);
      
      item.labels.forEach((label) => {
        if (!labelSet.has(label.name)) {
          labelSet.add(label.name);
          labels.push({ name: label.name, color: label.color });
        }
      });
    });

    return {
      assignees: Array.from(assignees).sort(),
      repositories: Array.from(repositories).sort(),
      labels: labels.sort((a, b) => a.name.localeCompare(b.name)),
      languages: Array.from(languages).sort(),
    };
  }, [assignedItems, mentionItems, staleItems]);

  const getActionItems = useCallback(
    (type: "all" | "assigned" | "mentions" | "stale") => {
      return actionItemsByType[type];
    },
    [actionItemsByType]
  );

  const isValidUrl = (url?: string): boolean => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return (
        parsed.protocol === "https:" && parsed.hostname.includes("github.com")
      );
    } catch {
      return false;
    }
  };

  const handleTabChange = (tab: string) => {
    if (VALID_TABS.includes(tab as ValidTab)) {
      router.push(`/action-required?tab=${tab}`);
    }
  };


  const ActionItemsList = ({
    type,
    icon: Icon,
    title,
    emptyMessage,
    emptyDescription,
  }: {
    type: "all" | "assigned" | "mentions" | "stale";
    icon: LucideIcon;
    title: string;
    emptyMessage: string;
    emptyDescription: string;
    color?: "blue" | "green" | "yellow" | "orange";
  }) => {
    const items = getActionItems(type);
    const isLoading = type === "all"
      ? loading.assigned || loading.mentions || loading.stale
      : loading[type];
    const error = type === "all"
      ? errors.assigned || errors.mentions || errors.stale
      : errors[type];

    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const { addTaskFromActionItem } = useKanbanStore();
    const { openPanel } = useDetailPanelStore();

    const toggleSelectAll = () => {
      if (selectedItems.size === items.length) {
        setSelectedItems(new Set());
      } else {
        setSelectedItems(new Set(items.map((item: ActionItem) => item.id.toString())));
      }
    };

    const toggleSelectItem = (itemId: string) => {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      setSelectedItems(newSelected);
    };

    const handleBulkAddToKanban = () => {
      const itemsToAdd = items.filter((item: ActionItem) =>
        selectedItems.has(item.id.toString())
      );
      itemsToAdd.forEach((item: ActionItem) => {
        addTaskFromActionItem(item as StoreActionItem, "", "todo");
      });
      setSelectedItems(new Set());
    };

    if (isLoading) {
      return (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Title / Repository</TableHead>
                <TableHead className="w-[10%]">Author</TableHead>
                <TableHead className="w-[18%]">Labels</TableHead>
                <TableHead className="w-[10%]">Priority</TableHead>
                <TableHead className="w-[8%]">Activity</TableHead>
                <TableHead className="w-[10%]">Updated</TableHead>
                <TableHead className="w-[14%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="animate-pulse">
                      <div className="w-48 h-4 bg-gray-300 dark:bg-gray-600 rounded mb-1" />
                      <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <div className="w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                      <div className="w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="w-12 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 text-red-500">
          <Icon className="w-12 h-12 mx-auto mb-4 text-red-300" />
          <p>Failed to load {title.toLowerCase()}</p>
          <p className="text-sm mt-2">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              if (type === "all") {
                ["assigned", "mentions", "stale"].forEach((t) => {
                  refreshData(t as "assigned" | "mentions" | "stale").catch((error) => {
                    console.error(`Failed to refresh ${t} items:`, error);
                  });
                });
              } else {
                refreshData(type).catch((error) => {
                  console.error(`Failed to refresh ${type} items:`, error);
                });
              }
            }}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Retry
          </Button>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Icon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>{emptyMessage}</p>
          <p className="text-sm mt-2">{emptyDescription}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {selectedItems.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedItems.size} selected</Badge>
            <Button size="sm" onClick={handleBulkAddToKanban}>
              <Plus className="w-4 h-4 mr-2" />
              Bulk Add to Kanban
            </Button>
          </div>
        )}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[3%]">
                  <Checkbox
                    checked={selectedItems.size === items.length && items.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[27%]">Title / Repository</TableHead>
                <TableHead className="w-[10%]">Author</TableHead>
                <TableHead className="w-[15%]">Labels</TableHead>
                <TableHead className="w-[8%]">Priority</TableHead>
                <TableHead className="w-[8%]">Size</TableHead>
                <TableHead className="w-[6%]">Activity</TableHead>
                <TableHead className="w-[9%]">Updated</TableHead>
                <TableHead className="w-[14%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: ActionItem) => (
              <TableRow
                key={item.id}
                className={`${getStaleRowClassName(item.daysOld)} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('button, a, input')) {
                    openPanel(item as unknown as import("@/components/ui/detail-panel").DetailPanelIssue);
                  }
                }}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedItems.has(item.id.toString())}
                    onCheckedChange={() => toggleSelectItem(item.id.toString())}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {extractIssueNumber(item.url) && (
                          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono flex-shrink-0">
                            #{extractIssueNumber(item.url)}
                          </span>
                        )}
                        <span className="font-medium truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                          {item.title}
                        </span>
                        {item.url && isValidUrl(item.url) && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-shrink-0 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Open in GitHub"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {item.type === "pullRequest" && item.mergeable === "CONFLICTING" && (
                          <span title="Has merge conflicts">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          </span>
                        )}
                        {item.type === "pullRequest" && item.statusCheckRollup?.state === "SUCCESS" && (
                          <span title="All checks passed">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          </span>
                        )}
                        {item.type === "pullRequest" && item.statusCheckRollup?.state === "FAILURE" && (
                          <span title="Checks failed">
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          </span>
                        )}
                        {item.type === "pullRequest" && item.statusCheckRollup?.state === "PENDING" && (
                          <span title="Checks pending">
                            <Loader2 className="w-4 h-4 text-yellow-500 flex-shrink-0 animate-spin" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {item.repo}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <UserHoverCard username={item.author.login} showScore={true}>
                    <div className="flex items-center gap-2 cursor-pointer">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={item.author.avatarUrl} alt={item.author.login} />
                        <AvatarFallback>
                          {item.author.login.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors truncate max-w-20">
                        {item.author.login}
                      </span>
                    </div>
                  </UserHoverCard>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {item.labels.slice(0, 3).map((label, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs"
                        style={
                          label.color
                            ? {
                                borderColor: `#${label.color}`,
                                backgroundColor: `#${label.color}20`,
                                color: `#${label.color}`,
                              }
                            : undefined
                        }
                      >
                        {label.name}
                      </Badge>
                    ))}
                    {item.labels.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.labels.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.priority === "urgent"
                        ? "destructive"
                        : item.priority === "high"
                        ? "destructive"
                        : item.priority === "medium"
                        ? "default"
                        : "secondary"
                    }
                    className="capitalize"
                  >
                    {item.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.type === "pullRequest" && (item.additions !== undefined || item.deletions !== undefined) ? (
                    <div className="flex flex-col text-xs">
                      <span className="text-green-600 dark:text-green-400">+{item.additions || 0}</span>
                      <span className="text-red-600 dark:text-red-400">-{item.deletions || 0}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <MessageSquare className="w-4 h-4" />
                    <span>{item.comments || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(item.updatedAt)}
                  </div>
                </TableCell>
                <TableCell>
                  <QuickActionsMenu
                    item={item as StoreActionItem}
                    itemType={
                      type === "all"
                        ? ("mentionType" in item || "mentionedAt" in item)
                          ? "mentions"
                          : ("daysStale" in item || "lastActivity" in item)
                          ? "stale"
                          : "assigned"
                        : type
                    }
                  />
                </TableCell>
              </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <PageHeader />

      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Action Required
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsNewIssueOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Issue
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentTab === "all") {
                  ["assigned", "mentions", "stale"].forEach((type) => {
                    refreshData(type as "assigned" | "mentions" | "stale").catch((error) => {
                      console.error(`Failed to refresh ${type} items:`, error);
                    });
                  });
                } else {
                  refreshActiveTab(currentTab);
                }
              }}
              disabled={currentTab === "all"
                ? loading.assigned || loading.mentions || loading.stale
                : loading[currentTab]}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  (currentTab === "all"
                    ? loading.assigned || loading.mentions || loading.stale
                    : loading[currentTab])
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </Button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Items that need your immediate attention across your repositories
        </p>
      </div>

      {/* Filters Panel */}
      <ActionRequiredFiltersPanel
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        availableAssignees={availableFilterOptions.assignees}
        availableRepositories={availableFilterOptions.repositories}
        availableLabels={availableFilterOptions.labels}
        availableLanguages={availableFilterOptions.languages}
      />

      {/* Action Required Tabs */}
      <Tabs
        value={currentTab}
        onValueChange={(value: string) => {
          if (VALID_TABS.includes(value as ValidTab)) {
            handleTabChange(value);
          }
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            All
            <Badge variant="secondary" className="ml-1">
              {itemCounts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="assigned" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Assigned
            <Badge variant="secondary" className="ml-1">
              {itemCounts.assigned}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="mentions" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Mentions
            <Badge variant="secondary" className="ml-1">
              {itemCounts.mentions}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="stale" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Stale PRs
            <Badge variant="destructive" className="ml-1">
              {itemCounts.stale}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                All Action Items
                <Badge variant="outline" className="ml-auto">
                  {itemCounts.all} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActionItemsList
                type="all"
                icon={Zap}
                title="All Items"
                emptyMessage="No action items found"
                emptyDescription="All your action items will appear here"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assigned" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Assigned Issues & PRs
                <Badge variant="outline" className="ml-auto">
                  {itemCounts.assigned} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActionItemsList
                type="assigned"
                icon={Target}
                title="Assigned Items"
                emptyMessage="No assigned items found"
                emptyDescription="Items assigned to you will appear here"
                color="blue"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-500" />
                Mentions & Reviews
                <Badge variant="outline" className="ml-auto">
                  {itemCounts.mentions} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActionItemsList
                type="mentions"
                icon={MessageSquare}
                title="Mentions & Reviews"
                emptyMessage="No mentions found"
                emptyDescription="Items where you're mentioned will appear here"
                color="green"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stale" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Stale Pull Requests
                <Badge variant="outline" className="ml-auto">
                  {itemCounts.stale} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActionItemsList
                type="stale"
                icon={Clock}
                title="Stale Pull Requests"
                emptyMessage="No stale PRs found"
                emptyDescription="Old pull requests will appear here"
                color="orange"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DetailPanel issue={selectedIssue} isOpen={isOpen} onClose={closePanel} />
      <NewIssueDialog open={isNewIssueOpen} onOpenChange={setIsNewIssueOpen} />
    </div>
  );
}

export default function ActionRequiredPage() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading action required items...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-8"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        }
      >
        <ActionRequiredContent />
      </Suspense>
      <SearchModal />
    </Layout>
  );
}
