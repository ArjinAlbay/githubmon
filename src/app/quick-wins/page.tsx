"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/hooks/useAuth";
import { useQuickWins } from "@/components/quick-wins/hooks/useQuickWins";
import { QuickWinsTable } from "@/components/quick-wins/QuickWinsTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { Lightbulb, Wrench } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useMemo } from "react";
import { RateLimitWarning } from "@/components/common/RateLimitWarning";
import { useQuickWinsFilters } from "@/hooks/useFilters";
import { QuickWinsFiltersPanel } from "@/components/filters/QuickWinsFiltersPanel";
import type { GitHubIssue } from "@/types/quickWins";

const VALID_TABS = ["good-issues", "easy-fixes"] as const;
type ValidTab = (typeof VALID_TABS)[number];

function QuickWinsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState<ValidTab>("good-issues");
  
  const { filters, updateFilters, resetFilters, hasActiveFilters } = useQuickWinsFilters();

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam && VALID_TABS.includes(tabParam as ValidTab)) {
      setCurrentTab(tabParam as ValidTab);
    }
  }, [searchParams]);

  const {
    goodIssues,
    easyFixes,
    loadingGoodIssues,
    loadingEasyFixes,
    goodIssuesError,
    easyFixesError,
    refreshGoodIssues,
    refreshEasyFixes,
  } = useQuickWins();

  const handleTabChange = (tab: string) => {
    if (VALID_TABS.includes(tab as ValidTab)) {
      setCurrentTab(tab as ValidTab);
      router.push(`/quick-wins?tab=${tab}`);
    }
  };

  const applyFilters = (issues: GitHubIssue[]) => {
    return issues.filter((issue) => {
      if (filters.difficulty.length > 0 && !filters.difficulty.includes(issue.difficulty)) {
        return false;
      }

      if (filters.language.length > 0) {
        if (!issue.language || !filters.language.includes(issue.language)) {
          return false;
        }
      }

      if (filters.repository.length > 0 && !filters.repository.includes(issue.repository)) {
        return false;
      }

      if (filters.minStars !== null && filters.minStars > 0) {
        if (issue.stars < filters.minStars) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredGoodIssues = useMemo(() => applyFilters(goodIssues), [goodIssues, filters]);
  const filteredEasyFixes = useMemo(() => applyFilters(easyFixes), [easyFixes, filters]);

  const availableFilterOptions = useMemo(() => {
    const allIssues = [...goodIssues, ...easyFixes];
    
    const languages = new Set<string>();
    const repositories = new Set<string>();

    allIssues.forEach((issue) => {
      if (issue.language) languages.add(issue.language);
      if (issue.repository) repositories.add(issue.repository);
    });

    return {
      languages: Array.from(languages).sort(),
      repositories: Array.from(repositories).sort(),
    };
  }, [goodIssues, easyFixes]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <PageHeader title="Quick Wins" />
      <RateLimitWarning />

      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            <span className="text-lg font-medium text-muted-foreground">
              Easy opportunities to contribute and grow
            </span>
              Quick Wins
            </h1>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Discover easy issues and good first contributions to jumpstart your
          open source journey
        </p>
      </div>

      {/* Filters Panel */}
      <QuickWinsFiltersPanel
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        availableLanguages={availableFilterOptions.languages}
        availableRepositories={availableFilterOptions.repositories}
      />

      {/* Quick Wins Tabs */}
      <Tabs
        value={currentTab}
        onValueChange={(value) => {
          if (VALID_TABS.includes(value as ValidTab)) {
            handleTabChange(value);
          }
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="good-issues" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Good First Issues
            <Badge variant="secondary" className="ml-1">
              {filteredGoodIssues.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="easy-fixes" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Easy Fixes
            <Badge variant="secondary" className="ml-1">
              {filteredEasyFixes.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="good-issues" className="mt-6">
          <QuickWinsTable
            data={filteredGoodIssues}
            loading={loadingGoodIssues}
            error={goodIssuesError}
            onRefresh={refreshGoodIssues}
            title="Good First Issues"
            emptyMessage="No good first issues found"
          />
        </TabsContent>

        <TabsContent value="easy-fixes" className="mt-6">
          <QuickWinsTable
            data={filteredEasyFixes}
            loading={loadingEasyFixes}
            error={easyFixesError}
            onRefresh={refreshEasyFixes}
            title="Easy Fixes"
            emptyMessage="No easy fixes found"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function QuickWinsPage() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quick wins...</p>
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
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        }
      >
        <QuickWinsContent />
      </Suspense>
    </Layout>
  );
}
