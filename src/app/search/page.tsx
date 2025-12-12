"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Header } from "@/components/layout/Header";
import { useRequireAuth } from "@/hooks/useAuth";
import {
  SidebarSearch,
  SidebarToggle,
} from "@/components/layout/SidebarSearch";
import { useSearchStore, useSidebarState } from "@/stores";
import { usePreferencesStore } from "@/stores/preferences";
import { SearchModal } from "@/components/search/SearchModal";
import { githubAPIClient } from "@/lib/api/github-api-client";
import {
  Star,
  GitFork,
  Eye,
  ExternalLink,
  Search,
  User,
  Package,
  Activity,
  Code,
  GitPullRequest,
  AlertCircle,
  Calendar,
  UserPlus,
  BarChart3,
  GitCommit,
  Folder,
} from "lucide-react";
import type { TrendingRepo, TopContributor } from "@/types/oss-insight";
import { AreaChart, BarChart, LineChart } from "@/components/charts";
import ChartWrapper from "@/components/charts/ChartWrapper";
import { RepoResultLayout } from "@/components/search/RepoResultLayout";
import { UserResultLayout } from "@/components/search/UserResultLayout";
import { OrgResultLayout } from "@/components/search/OrgResultLayout";
import {
  convertRepoToUnified,
  convertUserToUnified,
  detectSearchResultType,
  isRepositoryResult,
  isUserResult,
  isOrganizationResult,
} from "@/types/search";
import type { UnifiedSearchResult } from "@/types/search";

interface UserBehaviorData extends Record<string, string | number> {
  day: string;
  commits: number;
  prs: number;
  issues: number;
}

interface UserOverviewData extends Record<string, string | number> {
  name: string;
  commits: number;
  stars: number;
  repos: number;
}

interface UserAnalytics {
  profile?: {
    avatar_url: string;
    login: string;
    type: string;
    bio: string | null;
    public_repos: number;
    followers: number;
    following: number;
    location: string | null;
    company: string | null;
    html_url: string;
  };
  overview?: Array<UserOverviewData>;
  languages?: Array<{
    name: string;
    value: number;
  }>;
  behavior?: Array<UserBehaviorData>;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const userParam = searchParams?.get("user");
  const repoParam = searchParams?.get("repo");
  const { setCurrentQuery, setCurrentSearchType, setSearchModalOpen } =
    useSearchStore();
  const { pinnedRepos, favoriteUsers, togglePinnedRepo, toggleFavoriteUser } =
    usePreferencesStore();

  const [searchResults, setSearchResults] = useState<{
    repos: TrendingRepo[];
    users: TopContributor[];
    loading: boolean;
    error: string | null;
  }>({
    repos: [],
    users: [],
    loading: false,
    error: null,
  });

  const [activeSection, setActiveSection] = useState<string>("overview");
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(
    null
  );
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);
  const [unifiedResult, setUnifiedResult] = useState<UnifiedSearchResult | null>(null);

  const loadUserAnalytics = useCallback(async () => {
    if (!userParam) return;

    setLoadingAnalytics(true);
    try {
      const analytics = await githubAPIClient.getUserAnalytics(userParam);
      if (analytics) {
        const convertedAnalytics: UserAnalytics = {
          profile: analytics.profile
            ? {
                avatar_url: analytics.profile.avatar_url,
                login: analytics.profile.login,
                type: analytics.profile.type,
                bio: analytics.profile.bio ?? null,
                public_repos: analytics.profile.public_repos,
                followers: analytics.profile.followers,
                following: analytics.profile.following,
                location: analytics.profile.location ?? null,
                company: analytics.profile.company ?? null,
                html_url: analytics.profile.html_url,
              }
            : undefined,
          overview: analytics.overview,
          languages: analytics.languages,
          behavior: analytics.behavior,
        };
        setUserAnalytics(convertedAnalytics);
      } else {
        setUserAnalytics(null);
      }
    } catch (error) {
      console.error("Analytics error:", error);
      // Fallback to null if API fails
      setUserAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [userParam]);

  const throttle = useCallback(
    <T extends (...args: unknown[]) => void>(
      func: T,
      delay: number
    ): ((...args: Parameters<T>) => void) => {
      let timeoutId: NodeJS.Timeout | undefined;
      let lastExecTime = 0;

      return function (this: unknown, ...args: Parameters<T>) {
        const currentTime = Date.now();

        if (currentTime - lastExecTime > delay) {
          func.apply(this, args);
          lastExecTime = currentTime;
        } else {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          timeoutId = setTimeout(() => {
            func.apply(this, args);
            lastExecTime = Date.now();
          }, delay - (currentTime - lastExecTime));
        }
      };
    },
    []
  );

  useEffect(() => {
    const handleScroll = throttle(() => {
      const sectionIds = [
        "overview",
        "behavior",
        "star",
        "code",
        "code-review",
        "issue",
        "monthly-stats",
        "contribution-activities",
      ];
      const headerOffset = 150; // Increased offset
      let currentActiveSection = "overview";

      // Check each section's h2 title position
      for (const sectionId of sectionIds) {
        const sectionElement = document.getElementById(sectionId);
        if (!sectionElement) continue;

        const h2Element = sectionElement.querySelector("h2");
        if (!h2Element) continue;

        const h2Rect = h2Element.getBoundingClientRect();

        // If h2 title is at or above header offset, this section is active
        if (h2Rect.top <= headerOffset) {
          currentActiveSection = sectionId;
        } else {
          // First h2 that hasn't reached header yet - stop here
          break;
        }
      }

      // Bottom of page special case
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 50
      ) {
        currentActiveSection = "contribution-activities";
      }

      if (currentActiveSection !== activeSection) {
        setActiveSection(currentActiveSection);
      }
    }, 100);

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeSection, throttle]);

  useEffect(() => {
    if (userParam || repoParam) {
      const query = userParam || repoParam || "";
      const type = userParam ? "users" : "repos";
      setUserAnalytics(null);
      setSearchResults({
        repos: [],
        users: [],
        loading: false,
        error: null,
      });

      setCurrentQuery(query);
      setCurrentSearchType(type);
      performSearch(query, type);
      setHasSearched(true);

      if (userParam) {
        loadUserAnalytics();
      }
    }
  }, [
    userParam,
    repoParam,
    setCurrentQuery,
    setCurrentSearchType,
    loadUserAnalytics,
  ]);

  const actionableInsights = useMemo(() => {
    if (
      !userAnalytics?.behavior ||
      !userAnalytics.languages ||
      userAnalytics.behavior.length === 0
    ) {
      return [];
    }

    const busiestDay = userAnalytics.behavior.reduce(
      (max, day) =>
        day.commits + day.prs + day.issues >
        max.commits + max.prs + max.issues
          ? day
          : max,
      userAnalytics.behavior[0]
    );

    const topLanguage = [...userAnalytics.languages].sort(
      (a, b) => b.value - a.value
    )[0];

    const totalActivity = userAnalytics.behavior.reduce(
      (sum, day) => sum + day.commits + day.prs + day.issues,
      0
    );

    const prForwardDays = userAnalytics.behavior.filter(
      (day) => day.prs >= day.commits
    ).length;

    return [
      {
        title: "Best time to ask for reviews",
        metric: busiestDay.day,
        description: `Most activity happens on ${busiestDay.day}. Line up review requests then.`,
      },
      {
        title: "Lead with their core stack",
        metric: topLanguage?.name || "Multi-stack",
        description: topLanguage
          ? `They ship most in ${topLanguage.name}. Pitch PRs and issues in that stack.`
          : "Work is spread across stacks — start with small, scoped tasks.",
      },
      {
        title: "Weekly cadence",
        metric: `${totalActivity} actions`,
        description:
          totalActivity >= 30
            ? "High velocity — propose pairing or quick co-reviews."
            : "Cadence is lighter — share low-friction wins first.",
      },
      {
        title: "PR readiness",
        metric: `${prForwardDays} review-heavy days`,
        description:
          prForwardDays > 2
            ? "They touch PRs several days a week — send review asks instead of issues."
            : "Prep starter issues to make it easy for them to engage.",
      },
    ];
  }, [userAnalytics]);
  const performSearch = async (query: string, type: "users" | "repos") => {
    setSearchResults((prev) => ({ ...prev, loading: true, error: null }));
    setUnifiedResult(null);

    try {
      if (type === "users") {
        const users = await githubAPIClient.searchUsers(query, "all", 20);
        setSearchResults({
          repos: [],
          users: users || [],
          loading: false,
          error: null,
        });

        if (users && users.length > 0) {
          const resultType = detectSearchResultType(query, { repos: [], users });

          if (resultType === "user" || resultType === "organization") {
            const firstUser = users[0];
            const converted = convertUserToUnified(firstUser);
            setUnifiedResult(converted);
          }
        }
      } else {
        const repos = await githubAPIClient.searchRepositories(
          query,
          "stars",
          20
        );
        setSearchResults({
          repos: repos || [],
          users: [],
          loading: false,
          error: null,
        });

        if (repos && repos.length > 0) {
          const resultType = detectSearchResultType(query, { repos, users: [] });

          if (resultType === "repository" && repos.length === 1) {
            const converted = convertRepoToUnified(repos[0]);
            setUnifiedResult(converted);
          }
        }
      }
    } catch (error) {
      setSearchResults({
        repos: [],
        users: [],
        loading: false,
        error: "Search failed. Please try again.",
      });
    }
  };

  // Dispatch active section to sidebar
  useEffect(() => {
    const event = new CustomEvent("activeSectionChange", {
      detail: { section: activeSection },
    });
    window.dispatchEvent(event);
  }, [activeSection]);

  return (
    <main className="flex-1 lg:ml-80 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Show search prompt if no parameters */}
        {!userParam && !repoParam && !hasSearched && (
          <div className="text-center py-12">
            <div className="mb-6">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Search GitHub
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Use the search functionality to find users or repositories
              </p>
            </div>

            <Button
              onClick={() => setSearchModalOpen(true)}
              className="px-6 py-3"
            >
              <Search className="w-5 h-5 mr-2" />
              Open Search
            </Button>
          </div>
        )}

        {/* Polymorphic Search Results */}
        {unifiedResult && !searchResults.loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">
                {isRepositoryResult(unifiedResult) && "Repository"}
                {isUserResult(unifiedResult) && "User Profile"}
                {isOrganizationResult(unifiedResult) && "Organization"}
              </h1>
              <Badge variant="secondary">Actionable view</Badge>
            </div>

            {isRepositoryResult(unifiedResult) && (
              <RepoResultLayout result={unifiedResult} />
            )}
            {isUserResult(unifiedResult) && (
              <UserResultLayout result={unifiedResult} />
            )}
            {isOrganizationResult(unifiedResult) && (
              <OrgResultLayout result={unifiedResult} />
            )}
          </div>
        )}

        {userParam && actionableInsights.length > 0 && (
          <Card className="mt-6 border-dashed">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Action prompts
                  </p>
                  <h2 className="text-xl font-semibold">Make this profile actionable</h2>
                </div>
                <Badge variant="outline">Signals</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {actionableInsights.map((insight) => (
                  <div
                    key={insight.title}
                    className="p-4 rounded-lg border bg-muted/40"
                  >
                    <p className="text-sm font-semibold mb-1">{insight.title}</p>
                    <p className="text-lg font-bold">{insight.metric}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Results with Analytics */}
        {userParam &&
          searchResults.users.length > 0 &&
          !searchResults.loading && (
            <div className="space-y-8">
              {/* User Profile Section */}
              <div></div>
              <div className="grid gap-4 mb-8">
                {userAnalytics?.profile && (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Image
                          src={userAnalytics.profile.avatar_url}
                          alt={userAnalytics.profile.login}
                          width={80}
                          height={80}
                          className="rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h2 className="text-2xl font-semibold">
                              {userAnalytics.profile.login}
                            </h2>
                            <Badge variant="outline">
                              {userAnalytics.profile.type}
                            </Badge>
                          </div>
                          {userAnalytics.profile.bio && (
                            <p className="text-gray-600 mb-3">
                              {userAnalytics.profile.bio}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              Repos: {userAnalytics.profile.public_repos}
                            </span>
                            <span>
                              Followers: {userAnalytics.profile.followers}
                            </span>
                            <span>
                              Following: {userAnalytics.profile.following}
                            </span>
                          </div>
                          {userAnalytics.profile.location && (
                            <p className="text-sm text-gray-500 mt-2">
                              📍 {userAnalytics.profile.location}
                            </p>
                          )}
                          {userAnalytics.profile.company && (
                            <p className="text-sm text-gray-500 mt-1">
                              🏢 {userAnalytics.profile.company}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={
                              favoriteUsers.includes(userAnalytics.profile!.login)
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              toggleFavoriteUser(userAnalytics.profile!.login)
                            }
                          >
                            <Star
                              className={`w-4 h-4 mr-2 ${
                                favoriteUsers.includes(userAnalytics.profile!.login)
                                  ? "fill-current"
                                  : ""
                              }`}
                            />
                            {favoriteUsers.includes(userAnalytics.profile!.login)
                              ? "Favorited"
                              : "Add Favorite"}
                          </Button>
                          <Button asChild>
                            <a
                              href={userAnalytics.profile.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Profile
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Fallback to search results if no analytics profile */}
                {!userAnalytics?.profile &&
                  searchResults.users.slice(0, 1).map((user) => (
                    <Card
                      key={user.login}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <Image
                            src={user.avatar_url}
                            alt={user.login}
                            width={80}
                            height={80}
                            className="rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h2 className="text-2xl font-semibold">
                                {user.login}
                              </h2>
                              <Badge variant="outline">{user.type}</Badge>
                            </div>
                            {user.bio && (
                              <p className="text-gray-600 mb-3">{user.bio}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Repos: {user.repos_count}</span>
                              <span>Followers: {user.followers_count}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant={
                                favoriteUsers.includes(user.login)
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => toggleFavoriteUser(user.login)}
                            >
                              <Star
                                className={`w-4 h-4 mr-2 ${
                                  favoriteUsers.includes(user.login)
                                    ? "fill-current"
                                    : ""
                                }`}
                              />
                              {favoriteUsers.includes(user.login)
                                ? "Favorited"
                                : "Add Favorite"}
                            </Button>
                            <Button asChild>
                              <a
                                href={user.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Profile
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

        {/* Analytics Sections */}
        {userAnalytics?.overview &&
          userAnalytics?.languages &&
          userAnalytics?.behavior &&
          !loadingAnalytics && (
            <>
              {/* Overview Section */}
              <div id="overview" className="scroll-mt-20">
                <div className="flex items-center mb-6">
                  <Eye className="w-6 h-6 mr-2" />
                  <h2 className="text-2xl font-bold">Overview</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <ChartWrapper
                    title="Activity Overview"
                    loading={false}
                    height={200}
                  >
                    <AreaChart
                      data={userAnalytics.overview}
                      xField="name"
                      yFields={["commits", "stars"]}
                      height={200}
                      stack={true}
                      colors={["#8884d8", "#82ca9d"]}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Language Distribution"
                    loading={false}
                    height={200}
                  >
                    <BarChart
                      data={userAnalytics.languages}
                      xField="name"
                      yFields={["value"]}
                      height={200}
                      colors={[
                        "#8884d8",
                        "#82ca9d",
                        "#ffc658",
                        "#ff7c7c",
                        "#8dd1e1",
                        "#d084d0",
                        "#ffb347",
                      ]}
                    />
                  </ChartWrapper>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-semibold">Quick Stats</h3>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Metric</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Folder className="w-4 h-4 text-gray-500" />
                                Total Repositories
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {userAnalytics.profile?.public_repos || 0}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                Total Followers
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {userAnalytics.profile?.followers || 0}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <UserPlus className="w-4 h-4 text-gray-500" />
                                Following
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {userAnalytics.profile?.following || 0}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-gray-500" />
                                Total Stars Earned
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {userAnalytics.overview?.reduce(
                                (sum: number, item: UserOverviewData) =>
                                  sum + (item.stars || 0),
                                0
                              ) || 0}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <GitCommit className="w-4 h-4 text-gray-500" />
                                Total Commits
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {userAnalytics.overview?.reduce(
                                (sum: number, item: UserOverviewData) =>
                                  sum + (item.commits || 0),
                                0
                              ) || 0}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                {/* Behavior Section */}
                <div id="behavior" className="scroll-mt-20 mt-12">
                  <div className="flex items-center mb-6">
                    <Activity className="w-6 h-6 mr-2" />
                    <h2 className="text-2xl font-bold">Behavior Analysis</h2>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-3">
                          Weekly Activity Pattern
                        </h3>
                        <BarChart
                          data={userAnalytics.behavior}
                          xField="day"
                          yFields={["commits", "prs", "issues"]}
                          height={250}
                          colors={["#8884d8", "#82ca9d", "#ffc658"]}
                        />
                      </CardContent>
                    </Card>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-5 h-5 text-green-500" />
                        <h3 className="text-lg font-semibold">
                          Activity Summary
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="py-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">
                                  Most Active Day
                                </span>
                              </td>
                              <td className="py-3 text-right font-semibold">
                                {/* Most Active Day calculation */}
                                {userAnalytics.behavior?.length > 0
                                  ? userAnalytics.behavior.reduce(
                                      (
                                        max: UserBehaviorData,
                                        day: UserBehaviorData
                                      ) =>
                                        day.commits + day.prs + day.issues >
                                        max.commits + max.prs + max.issues
                                          ? day
                                          : max
                                    ).day
                                  : "N/A"}
                              </td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="py-3 flex items-center gap-2">
                                <GitCommit className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">
                                  Total Weekly Commits
                                </span>
                              </td>
                              <td className="py-3 text-right font-semibold">
                                {/* Weekly totals */}
                                {userAnalytics.behavior?.reduce(
                                  (sum: number, day: UserBehaviorData) =>
                                    sum + day.commits,
                                  0
                                ) || 0}
                              </td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="py-3 flex items-center gap-2">
                                <GitPullRequest className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">
                                  Total Weekly PRs
                                </span>
                              </td>
                              <td className="py-3 text-right font-semibold">
                                {userAnalytics.behavior?.reduce(
                                  (sum: number, day: UserBehaviorData) =>
                                    sum + day.prs,
                                  0
                                ) || 0}
                              </td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="py-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">
                                  Total Weekly Issues
                                </span>
                              </td>
                              <td className="py-3 text-right font-semibold">
                                {userAnalytics.behavior?.reduce(
                                  (sum: number, day: UserBehaviorData) =>
                                    sum + day.issues,
                                  0
                                ) || 0}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Star Section */}
                <div id="star" className="scroll-mt-20 mt-12">
                  <div className="flex items-center mb-6">
                    <Star className="w-6 h-6 mr-2" />
                    <h2 className="text-2xl font-bold">Star Activity</h2>
                  </div>

                  <ChartWrapper
                    title="Stars Over Time"
                    loading={false}
                    height={200}
                  >
                    <LineChart
                      data={userAnalytics.overview}
                      xField="name"
                      yFields={["stars"]}
                      height={200}
                      colors={["#8884d8"]}
                    />
                  </ChartWrapper>
                </div>
                {/* Code Section */}
                <div id="code" className="scroll-mt-20 mt-12">
                  <div className="flex items-center mb-6">
                    <Code className="w-6 h-6 mr-2" />
                    <h2 className="text-2xl font-bold">Code Contributions</h2>
                  </div>

                  <ChartWrapper
                    title="Commit Activity"
                    loading={false}
                    height={200}
                  >
                    <AreaChart
                      data={userAnalytics.overview}
                      xField="name"
                      yFields={["commits"]}
                      height={200}
                      colors={["#8884d8"]}
                    />
                  </ChartWrapper>
                </div>

                {/* Code Review Section */}
                <div id="code-review" className="scroll-mt-20 mt-12">
                  <div className="flex items-center mb-6">
                    <GitPullRequest className="w-6 h-6 mr-2" />
                    <h2 className="text-2xl font-bold">Code Review</h2>
                  </div>

                  <ChartWrapper
                    title="Pull Request Activity"
                    loading={false}
                    height={200}
                  >
                    <BarChart
                      data={userAnalytics.behavior}
                      xField="day"
                      yFields={["prs"]}
                      height={200}
                      colors={["#82ca9d"]}
                    />
                  </ChartWrapper>
                </div>

                {/* Issue Section */}
                <div id="issue" className="scroll-mt-20 mt-12">
                  <div className="flex items-center mb-6">
                    <AlertCircle className="w-6 h-6 mr-2" />
                    <h2 className="text-2xl font-bold">Issues</h2>
                  </div>

                  <ChartWrapper
                    title="Issue Activity"
                    loading={false}
                    height={200}
                  >
                    <LineChart
                      data={userAnalytics.behavior}
                      xField="day"
                      yFields={["issues"]}
                      height={200}
                      colors={["#ffc658"]}
                    />
                  </ChartWrapper>
                </div>

                {/* Monthly Statistics Section */}
                <div id="monthly-stats" className="scroll-mt-20 mt-12">
                  <div className="flex items-center mb-6">
                    <Calendar className="w-6 h-6 mr-2" />
                    <h2 className="text-2xl font-bold">Monthly Statistics</h2>
                  </div>

                  <ChartWrapper
                    title="Monthly Trends"
                    loading={false}
                    height={250}
                  >
                    <AreaChart
                      data={userAnalytics.overview}
                      xField="name"
                      yFields={["commits", "repos", "stars"]}
                      height={250}
                      stack={true}
                      colors={["#8884d8", "#82ca9d", "#ffc658"]}
                    />
                  </ChartWrapper>
                </div>

                {/* Contribution Activities Section */}
                <div
                  id="contribution-activities"
                  className="scroll-mt-20 mt-12"
                >
                  <div className="flex items-center mb-6">
                    <Activity className="w-6 h-6 mr-2" />
                    <h2 className="text-2xl font-bold">
                      Contribution Activities
                    </h2>
                  </div>

                  <ChartWrapper
                    title="Overall Contribution Pattern"
                    loading={false}
                    height={250}
                  >
                    <BarChart
                      data={userAnalytics.behavior}
                      xField="day"
                      yFields={["commits", "prs", "issues"]}
                      height={250}
                      colors={["#8884d8", "#82ca9d", "#ffc658"]}
                    />
                  </ChartWrapper>
                </div>
              </div>
            </>
          )}

        {/* Loading Analytics */}
        {loadingAnalytics && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        )}

        {/* No Analytics Data */}
        {!loadingAnalytics &&
          userAnalytics &&
          (!userAnalytics.overview ||
            !userAnalytics.languages ||
            !userAnalytics.behavior) && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Limited Analytics Data
              </h2>
              <p className="text-gray-600 mb-4">
                Analytics data for this user is limited or unavailable. This may
                be due to:
              </p>
              <ul className="text-sm text-gray-500 text-left max-w-md mx-auto">
                <li>• Private repositories or activity</li>
                <li>• Limited public activity</li>
                <li>• GitHub API rate limits</li>
              </ul>
            </div>
          )}

        {/* No User Found */}
        {!loadingAnalytics &&
          !userAnalytics &&
          searchResults.users.length === 0 && (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
              <p className="text-gray-600 mb-4">
                No user data available for &quot;{userParam}&quot;
              </p>
              <Button onClick={() => setSearchModalOpen(true)}>
                Try Different Search
              </Button>
            </div>
          )}

        {/* Repository Results */}
        {repoParam &&
          searchResults.repos.length > 0 &&
          !searchResults.loading &&
          !unifiedResult && (
            <div>
              <div className="flex items-center mb-6">
                <Package className="w-6 h-6 mr-2" />
                <h1 className="text-2xl font-bold">
                  Repositories matching &quot;{repoParam}&quot;
                </h1>
                <Badge variant="secondary" className="ml-3">
                  {searchResults.repos.length} results
                </Badge>
              </div>

              <div className="grid gap-4">
                {searchResults.repos.map((repo) => (
                  <Card
                    key={repo.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h2 className="text-xl font-semibold text-blue-600">
                              {repo.full_name}
                            </h2>
                            {repo.language && (
                              <Badge variant="outline">{repo.language}</Badge>
                            )}
                            {repo.archived && (
                              <Badge variant="secondary">Archived</Badge>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-gray-600 mb-3">
                              {repo.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Star className="w-4 h-4 mr-1" />
                              {repo.stargazers_count.toLocaleString()}
                            </span>
                            <span className="flex items-center">
                              <GitFork className="w-4 h-4 mr-1" />
                              {repo.forks_count.toLocaleString()}
                            </span>
                            <span className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {repo.watchers_count.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={
                              pinnedRepos.includes(repo.full_name)
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => togglePinnedRepo(repo.full_name)}
                          >
                            <Star
                              className={`w-4 h-4 mr-2 ${
                                pinnedRepos.includes(repo.full_name)
                                  ? "fill-current"
                                  : ""
                              }`}
                            />
                            {pinnedRepos.includes(repo.full_name)
                              ? "Pinned"
                              : "Pin Repo"}
                          </Button>
                          <Button asChild>
                            <a
                              href={repo.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Repo
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

        {/* No Results */}
        {(userParam || repoParam) &&
          !searchResults.loading &&
          !searchResults.error &&
          ((userParam && searchResults.users.length === 0) ||
            (repoParam && searchResults.repos.length === 0)) && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No results found</h2>
              <p className="text-gray-600 mb-4">
                No {userParam ? "users" : "repositories"} found for &quot;
                {userParam || repoParam}&quot;
              </p>
              <Button onClick={() => setSearchModalOpen(true)}>
                Try Different Search
              </Button>
            </div>
          )}

        {/* Error State */}
        {searchResults.error && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">
              Search Error
            </h2>
            <p className="text-gray-600 mb-4">{searchResults.error}</p>
            <Button onClick={() => setSearchModalOpen(true)}>Try Again</Button>
          </div>
        )}

        {/* Loading State */}
        {searchResults.loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching...</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  const { isLoading } = useRequireAuth();
  const { setOpen } = useSidebarState();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex flex-1">
          <SidebarToggle onClick={() => setOpen(true)} />
          <SidebarSearch />
          <main className="flex-1 lg:ml-80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1">
        <SidebarToggle onClick={() => setOpen(true)} />
        <SidebarSearch />
        <Suspense
          fallback={
            <main className="flex-1 lg:ml-80 p-6">
              <div className="max-w-5xl mx-auto">
                <div className="animate-pulse space-y-8">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="space-y-4">
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            </main>
          }
        >
          <SearchContent />
        </Suspense>
      </div>
      <SearchModal />
    </div>
  );
}
