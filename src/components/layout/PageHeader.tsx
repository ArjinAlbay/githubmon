"use client";

import { useDataCacheStore } from "@/stores/cache";
import { useQuickWinsStore } from "@/stores/quickWins";
import { AlertTriangle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchSection } from "@/components/SearchSection";
import { useEffect } from "react";
import Link from "next/link";
import type { TrendingRepo, TopContributor } from "@/types/oss-insight";

interface PageHeaderProps {
  title?: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  const { rateLimitInfo } = useDataCacheStore();
  const { goodIssues, easyFixes, fetchGoodIssues, fetchEasyFixes } = useQuickWinsStore();

  const totalQuickWins = goodIssues.length + easyFixes.length;

  useEffect(() => {
    fetchGoodIssues();
    fetchEasyFixes();
  }, [fetchGoodIssues, fetchEasyFixes]);

  const isRateLimitCritical =
    rateLimitInfo &&
    (rateLimitInfo.remaining === 0 ||
      (rateLimitInfo.remaining / rateLimitInfo.limit) * 100 < 10);

  const handleSearchResults = (results: (TrendingRepo | TopContributor)[]) => {
    // You can handle navigation to search page here if needed
    console.log("Search results:", results);
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b pb-4 top-0 z-10">
      {/* Left side - Title and Rate Limit Warning */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          {title && (
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          )}
          {isRateLimitCritical && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <Badge variant="destructive" className="text-xs">
                Rate Limit: {rateLimitInfo?.remaining || 0}/
                {rateLimitInfo?.limit || 0}
              </Badge>
            </div>
          )}
        </div>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>

      {/* Right side - Search Section and Quick Wins */}
      <div className="flex items-center gap-4 flex-1 lg:flex-none lg:min-w-0">
        {/* Search Section */}
        <div className="flex-1 lg:w-96 lg:flex-none">
          <SearchSection 
            onSearchResults={handleSearchResults}
            className="w-full"
          />
        </div>

        {/* Quick Wins Badge */}
        {totalQuickWins > 0 && (
          <Link href="/quick-wins">
            <Button variant="outline" size="sm" className="flex items-center gap-2 min-w-fit">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="hidden sm:inline">Quick Wins</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                {totalQuickWins}
              </Badge>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
