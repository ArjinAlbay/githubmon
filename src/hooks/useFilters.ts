import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  ActionRequiredFilters,
  QuickWinsFilters,
} from "@/types/filters";
import {
  DEFAULT_ACTION_REQUIRED_FILTERS,
  DEFAULT_QUICK_WINS_FILTERS,
} from "@/types/filters";

function parseArrayFilter(param: string | null): string[] {
  if (!param) return [];
  return param.split(",").filter(Boolean);
}

function parseNumberFilter(param: string | null): number | null {
  if (!param) return null;
  const num = parseInt(param, 10);
  return isNaN(num) ? null : num;
}

function serializeFilters(filters: Record<string, any>): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      params.set(key, value.join(","));
    } else if (typeof value === "number" && value > 0) {
      params.set(key, value.toString());
    } else if (value !== null && value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  return params;
}

export function useActionRequiredFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ActionRequiredFilters>(
    DEFAULT_ACTION_REQUIRED_FILTERS
  );

  useEffect(() => {
    const assignee = parseArrayFilter(searchParams?.get("assignee"));
    const repository = parseArrayFilter(searchParams?.get("repository"));
    const labels = parseArrayFilter(searchParams?.get("labels"));
    const type = parseArrayFilter(searchParams?.get("type")) as ("issue" | "pullRequest")[];
    const staleness = parseNumberFilter(searchParams?.get("staleness"));
    const language = parseArrayFilter(searchParams?.get("language"));

    setFilters({
      assignee,
      repository,
      labels,
      type,
      staleness,
      language,
    });
  }, [searchParams]);

  const updateFilters = useCallback(
    (newFilters: Partial<ActionRequiredFilters>) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);

      const currentTab = searchParams?.get("tab");
      const params = serializeFilters(updatedFilters);
      if (currentTab) {
        params.set("tab", currentTab);
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [filters, router, searchParams]
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_ACTION_REQUIRED_FILTERS);
    const currentTab = searchParams?.get("tab");
    if (currentTab) {
      router.push(`?tab=${currentTab}`, { scroll: false });
    } else {
      router.push("?", { scroll: false });
    }
  }, [router, searchParams]);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return (
      filters.assignee.length > 0 ||
      filters.repository.length > 0 ||
      filters.labels.length > 0 ||
      filters.type.length > 0 ||
      filters.staleness !== null ||
      filters.language.length > 0
    );
  }, [filters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters: hasActiveFilters(),
  };
}

export function useQuickWinsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<QuickWinsFilters>(
    DEFAULT_QUICK_WINS_FILTERS
  );

  useEffect(() => {
    const difficulty = parseArrayFilter(searchParams?.get("difficulty")) as ("easy" | "medium")[];
    const language = parseArrayFilter(searchParams?.get("language"));
    const sourceCategory = parseArrayFilter(searchParams?.get("sourceCategory")) as ("good-issues" | "easy-fixes")[];
    const repository = parseArrayFilter(searchParams?.get("repository"));
    const minStars = parseNumberFilter(searchParams?.get("minStars"));

    setFilters({
      difficulty,
      language,
      sourceCategory,
      repository,
      minStars,
    });
  }, [searchParams]);

  const updateFilters = useCallback(
    (newFilters: Partial<QuickWinsFilters>) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);

      const currentTab = searchParams?.get("tab");
      const params = serializeFilters(updatedFilters);
      if (currentTab) {
        params.set("tab", currentTab);
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [filters, router, searchParams]
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_QUICK_WINS_FILTERS);
    const currentTab = searchParams?.get("tab");
    if (currentTab) {
      router.push(`?tab=${currentTab}`, { scroll: false });
    } else {
      router.push("?", { scroll: false });
    }
  }, [router, searchParams]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.difficulty.length > 0 ||
      filters.language.length > 0 ||
      filters.sourceCategory.length > 0 ||
      filters.repository.length > 0 ||
      filters.minStars !== null
    );
  }, [filters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters: hasActiveFilters(),
  };
}
