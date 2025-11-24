import * as React from "react";
import { Filter, X, User, Folder, Tag, GitPullRequest, FileText, Clock, Code } from "lucide-react";
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
import type { ActionRequiredFilters } from "@/types/filters";
import { STALENESS_OPTIONS, TYPE_OPTIONS } from "@/types/filters";

interface ActionRequiredFiltersPanelProps {
  filters: ActionRequiredFilters;
  onFiltersChange: (filters: Partial<ActionRequiredFilters>) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  availableAssignees: string[];
  availableRepositories: string[];
  availableLabels: Array<{ name: string; color?: string }>;
  availableLanguages: string[];
}

export function ActionRequiredFiltersPanel({
  filters,
  onFiltersChange,
  onReset,
  hasActiveFilters,
  availableAssignees,
  availableRepositories,
  availableLabels,
  availableLanguages,
}: ActionRequiredFiltersPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const assigneeOptions: MultiSelectOption[] = availableAssignees.map((assignee) => ({
    label: assignee,
    value: assignee,
    icon: User,
  }));

  const repositoryOptions: MultiSelectOption[] = availableRepositories.map((repo) => ({
    label: repo,
    value: repo,
    icon: Folder,
  }));

  const labelOptions: MultiSelectOption[] = availableLabels.map((label) => ({
    label: label.name,
    value: label.name,
    icon: Tag,
  }));

  const typeOptions: MultiSelectOption[] = TYPE_OPTIONS.map((type) => ({
    label: type.label,
    value: type.value,
    icon: type.value === "issue" ? FileText : GitPullRequest,
  }));

  const languageOptions: MultiSelectOption[] = availableLanguages.map((lang) => ({
    label: lang,
    value: lang,
    icon: Code,
  }));

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.assignee.length > 0) count++;
    if (filters.repository.length > 0) count++;
    if (filters.labels.length > 0) count++;
    if (filters.type.length > 0) count++;
    if (filters.staleness !== null) count++;
    if (filters.language.length > 0) count++;
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Assignee Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Assignee
                  </label>
                  <MultiSelect
                    options={assigneeOptions}
                    selected={filters.assignee}
                    onChange={(values) => onFiltersChange({ assignee: values })}
                    placeholder="All assignees"
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

                {/* Labels Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    Labels
                  </label>
                  <MultiSelect
                    options={labelOptions}
                    selected={filters.labels}
                    onChange={(values) => onFiltersChange({ labels: values })}
                    placeholder="All labels"
                    className="w-full"
                  />
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Type
                  </label>
                  <MultiSelect
                    options={typeOptions}
                    selected={filters.type}
                    onChange={(values) => onFiltersChange({ type: values as ("issue" | "pullRequest")[] })}
                    placeholder="All types"
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

                {/* Staleness Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Staleness
                  </label>
                  <Select
                    value={filters.staleness?.toString() ?? "0"}
                    onValueChange={(value) =>
                      onFiltersChange({
                        staleness: value === "0" ? null : parseInt(value, 10),
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      {STALENESS_OPTIONS.map((option) => (
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
          {filters.assignee.map((assignee) => (
            <Badge key={assignee} variant="secondary" className="gap-1">
              <User className="h-3 w-3" />
              {assignee}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() =>
                  onFiltersChange({
                    assignee: filters.assignee.filter((a) => a !== assignee),
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
          {filters.labels.map((label) => (
            <Badge key={label} variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() =>
                  onFiltersChange({
                    labels: filters.labels.filter((l) => l !== label),
                  })
                }
              />
            </Badge>
          ))}
          {filters.type.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {type === "issue" ? (
                <FileText className="h-3 w-3" />
              ) : (
                <GitPullRequest className="h-3 w-3" />
              )}
              {type === "issue" ? "Issue" : "Pull Request"}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() =>
                  onFiltersChange({
                    type: filters.type.filter((t) => t !== type),
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
          {filters.staleness !== null && filters.staleness > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {STALENESS_OPTIONS.find((o) => o.value === filters.staleness?.toString())?.label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => onFiltersChange({ staleness: null })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
