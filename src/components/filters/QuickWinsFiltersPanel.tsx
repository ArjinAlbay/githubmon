import * as React from "react";
import { Filter, X, Code, Folder, Star, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { QuickWinsFilters } from "@/types/filters";
import { DIFFICULTY_OPTIONS, MIN_STARS_OPTIONS } from "@/types/filters";

interface QuickWinsFiltersPanelProps {
  filters: QuickWinsFilters;
  onFiltersChange: (filters: Partial<QuickWinsFilters>) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  availableLanguages: string[];
  availableRepositories: string[];
}

export function QuickWinsFiltersPanel({
  filters,
  onFiltersChange,
  onReset,
  hasActiveFilters,
  availableLanguages,
  availableRepositories,
}: QuickWinsFiltersPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const difficultyOptions: MultiSelectOption[] = DIFFICULTY_OPTIONS.map((difficulty) => ({
    label: difficulty.label,
    value: difficulty.value,
    icon: Target,
  }));

  const languageOptions: MultiSelectOption[] = availableLanguages.map((lang) => ({
    label: lang,
    value: lang,
    icon: Code,
  }));

  const repositoryOptions: MultiSelectOption[] = availableRepositories.map((repo) => ({
    label: repo,
    value: repo,
    icon: Folder,
  }));

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.difficulty.length > 0) count++;
    if (filters.language.length > 0) count++;
    if (filters.repository.length > 0) count++;
    if (filters.minStars !== null && filters.minStars > 0) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>

        <CollapsibleContent className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Difficulty Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    Difficulty
                  </label>
                  <MultiSelect
                    options={difficultyOptions}
                    selected={filters.difficulty}
                    onChange={(values) => onFiltersChange({ difficulty: values as ("easy" | "medium")[] })}
                    placeholder="All difficulties"
                    className="w-full"
                  />
                </div>

                {/* Language Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    Language
                  </label>
                  <MultiSelect
                    options={languageOptions}
                    selected={filters.language}
                    onChange={(values) => onFiltersChange({ language: values })}
                    placeholder="All languages"
                    className="w-full"
                  />
                </div>

                {/* Repository Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    Repository
                  </label>
                  <MultiSelect
                    options={repositoryOptions}
                    selected={filters.repository}
                    onChange={(values) => onFiltersChange({ repository: values })}
                    placeholder="All repositories"
                    className="w-full"
                  />
                </div>

                {/* Min Stars Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    Min Stars
                  </label>
                  <Select
                    value={filters.minStars?.toString() ?? "0"}
                    onValueChange={(value) =>
                      onFiltersChange({
                        minStars: value === "0" ? null : parseInt(value, 10),
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      {MIN_STARS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.difficulty.map((difficulty) => (
            <Badge key={difficulty} variant="secondary" className="gap-1">
              <Target className="h-3 w-3" />
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() =>
                  onFiltersChange({
                    difficulty: filters.difficulty.filter((d) => d !== difficulty),
                  })
                }
              />
            </Badge>
          ))}
          {filters.language.map((lang) => (
            <Badge key={lang} variant="secondary" className="gap-1">
              <Code className="h-3 w-3" />
              {lang}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() =>
                  onFiltersChange({
                    language: filters.language.filter((l) => l !== lang),
                  })
                }
              />
            </Badge>
          ))}
          {filters.repository.map((repo) => (
            <Badge key={repo} variant="secondary" className="gap-1">
              <Folder className="h-3 w-3" />
              {repo}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() =>
                  onFiltersChange({
                    repository: filters.repository.filter((r) => r !== repo),
                  })
                }
              />
            </Badge>
          ))}
          {filters.minStars !== null && filters.minStars > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3" />
              {MIN_STARS_OPTIONS.find((o) => o.value === filters.minStars?.toString())?.label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => onFiltersChange({ minStars: null })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
