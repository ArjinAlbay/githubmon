export interface FilterOption {
  label: string;
  value: string;
}

export interface LabelFilter {
  name: string;
  color?: string;
}

export interface ActionRequiredFilters {
  assignee: string[];
  repository: string[];
  labels: string[];
  type: ("issue" | "pullRequest")[];
  staleness: number | null;
  language: string[];
}

export interface QuickWinsFilters {
  difficulty: ("easy" | "medium")[];
  language: string[];
  sourceCategory: ("good-issues" | "easy-fixes")[];
  repository: string[];
  minStars: number | null;
}

export const DEFAULT_ACTION_REQUIRED_FILTERS: ActionRequiredFilters = {
  assignee: [],
  repository: [],
  labels: [],
  type: [],
  staleness: null,
  language: [],
};

export const DEFAULT_QUICK_WINS_FILTERS: QuickWinsFilters = {
  difficulty: [],
  language: [],
  sourceCategory: [],
  repository: [],
  minStars: null,
};

export const STALENESS_OPTIONS: FilterOption[] = [
  { label: "Any time", value: "0" },
  { label: "Older than 7 days", value: "7" },
  { label: "Older than 14 days", value: "14" },
  { label: "Older than 30 days", value: "30" },
  { label: "Older than 60 days", value: "60" },
  { label: "Older than 90 days", value: "90" },
];

export const DIFFICULTY_OPTIONS: FilterOption[] = [
  { label: "Easy", value: "easy" },
  { label: "Medium", value: "medium" },
];

export const TYPE_OPTIONS: FilterOption[] = [
  { label: "Issues", value: "issue" },
  { label: "Pull Requests", value: "pullRequest" },
];

export const MIN_STARS_OPTIONS: FilterOption[] = [
  { label: "Any", value: "0" },
  { label: "100+ stars", value: "100" },
  { label: "500+ stars", value: "500" },
  { label: "1000+ stars", value: "1000" },
  { label: "5000+ stars", value: "5000" },
];
