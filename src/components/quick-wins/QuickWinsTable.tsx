"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { createColumns } from "./columns";
import type { GitHubIssue } from "@/types/quickWins";
import { useKanbanStore } from "@/stores/kanban";
import { githubAPIClient } from "@/lib/api/github-api-client";
import { useAuthStore } from "@/stores/auth";

interface QuickWinsTableProps {
  data: GitHubIssue[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  title: string;
  emptyMessage?: string;
}

export function QuickWinsTable({
  data,
  loading,
  error,
  onRefresh,
  title,
  emptyMessage = "No issues found",
}: QuickWinsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [assigningIssueId, setAssigningIssueId] = useState<number | null>(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState<number | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const addTask = useKanbanStore((state) => state.addTask);
  const orgData = useAuthStore((state) => state.orgData);

  const handleAddToKanban = useCallback((issue: GitHubIssue) => {
    addTask({
      title: issue.title,
      description: `From ${issue.repository}`,
      type: "github-issue",
      priority: issue.priority,
      githubUrl: issue.url,
      labels: issue.labels.map((label) => label.name),
      columnId: "todo",
    });
  }, [addTask]);

  const handleAssignToMe = useCallback(async (issue: GitHubIssue) => {
    if (!orgData?.token) {
      setAssignmentError("You must be logged in to assign issues");
      setTimeout(() => setAssignmentError(null), 3000);
      return;
    }

    const urlParts = issue.url.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (!urlParts) {
      setAssignmentError("Invalid issue URL format");
      setTimeout(() => setAssignmentError(null), 3000);
      return;
    }

    const [, owner, repo, issueNumber] = urlParts;

    setAssigningIssueId(issue.id);
    setAssignmentError(null);

    githubAPIClient.setUserToken(orgData.token);

    const result = await githubAPIClient.assignIssueToMe(owner, repo, parseInt(issueNumber));

    setAssigningIssueId(null);

    if (result.success) {
      setAssignmentSuccess(issue.id);
      setTimeout(() => setAssignmentSuccess(null), 3000);
      onRefresh();
    } else {
      setAssignmentError(result.error || "Failed to assign issue");
      setTimeout(() => setAssignmentError(null), 3000);
    }
  }, [orgData, onRefresh]);

  const columns = useMemo(() => createColumns({
    onAddToKanban: handleAddToKanban,
    onAssignToMe: handleAssignToMe,
    assigningIssueId,
  }), [handleAddToKanban, handleAssignToMe, assigningIssueId]);

  const filteredData = useMemo(() => {
    let filtered = data;

    if (languageFilter !== "all") {
      filtered = filtered.filter((item) => item.language === languageFilter);
    }

    return filtered;
  }, [data, languageFilter]);

  const availableLanguages = useMemo(() => {
    const languages = [
      ...new Set(
        data
          .map((item) => item.language)
          .filter(
            (lang): lang is string =>
              typeof lang === "string" && lang.trim() !== ""
          )
      ),
    ];
    return languages.sort();
  }, [data]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {title}
                <Skeleton className="h-6 w-16" />
              </CardTitle>
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Failed to Load
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {title}
              <Badge variant="outline">{filteredData.length} issues</Badge>
            </CardTitle>
          </div>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {assignmentSuccess && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <span>Issue assigned successfully!</span>
          </div>
        )}

        {assignmentError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{assignmentError}</span>
          </div>
        )}
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-4 py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center py-12">
                      <Filter className="w-12 h-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        {emptyMessage}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Try adjusting your filters or refresh the data
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>
              Showing{" "}
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize}{" "}
              to{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{" "}
              of {table.getFilteredRowModel().rows.length} results
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
