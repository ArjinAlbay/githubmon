import type { GitHubIssue } from "@/types/quickWins";
import type { TrendingRepo, TopContributor } from "@/types/oss-insight";
import type { GitHubUserDetailed } from "@/types/github";

type RepositorySearchResult = TrendingRepo;
type UserSearchResult = TopContributor;

interface UserAnalyticsResult {
  profile: GitHubUserDetailed;
  overview: Array<{
    name: string;
    commits: number;
    stars: number;
    repos: number;
  }>;
  languages: Array<{ name: string; value: number }>;
  behavior: Array<{
    day: string;
    commits: number;
    prs: number;
    issues: number;
  }>;
}

interface RepoMetrics {
  fullName: string;
  stars: number;
  previousStars: number;
  starChange: number;
  newIssues24h: number;
  language: string | null;
  description: string | null;
  lastActivity: string;
  url: string;
}

interface UserMetrics {
  username: string;
  avatarUrl: string;
  recentActivity: number;
  topLanguages: string[];
  reposCount: number;
  followers: number;
  bio: string | null;
  url: string;
}

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

interface RateLimit {
  limit: number;
  cost: number;
  remaining: number;
  resetAt: string;
}

interface SearchResult {
  search: {
    nodes: Issue[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string;
    };
  };
  rateLimit: RateLimit;
}

interface Issue {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  labels: {
    nodes: Array<{ name: string; color: string }>;
  };
  repository: {
    name: string;
    nameWithOwner: string;
    stargazerCount: number | null;
    primaryLanguage: { name: string } | null;
    owner: {
      login: string;
      avatarUrl: string;
    };
  };
  author: {
    login: string;
    avatarUrl: string;
  } | null;
  comments: {
    totalCount: number;
  };
}

interface ActionRequiredResult {
  assigned: GitHubActionItem[];
  mentions: GitHubActionItem[];
  stale: GitHubActionItem[];
  rateLimit: RateLimit;
}

interface GitHubActionItem {
  id: string;
  title: string;
  url: string;
  repo: string;
  type: "issue" | "pullRequest";
  author: {
    login: string;
    avatarUrl: string;
  };
  labels: Array<{ name: string; color?: string }>;
  priority: "urgent" | "high" | "medium" | "low";
  daysOld: number;
  createdAt: string;
  updatedAt: string;
  mentionType?: "mention" | "review_request" | "comment";
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

interface ActionRequiredQueryResult {
  user: {
    assignedIssues: {
      nodes: ActionItem[];
    };
    pullRequests: {
      nodes: PullRequest[];
    };
  };
  stalePRs: {
    nodes: StalePullRequest[];
  };
  staleReviewRequests: {
    nodes: StalePullRequest[];
  };
  mentions: {
    nodes: (ActionItem | PullRequestWithReviews)[];
  };
  reviewRequests: {
    nodes: PullRequestWithReviews[];
  };
  rateLimit: RateLimit;
}

interface ActionItem {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  repository: {
    nameWithOwner: string;
    stargazerCount: number;
    primaryLanguage?: { name: string } | null;
  };
  author: {
    login: string;
    avatarUrl: string;
  } | null;
  labels: {
    nodes: Array<{ name: string; color?: string }>;
  };
  comments: {
    totalCount: number;
  };
  __typename?: string;
}

interface PullRequest {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  repository: {
    nameWithOwner: string;
    stargazerCount: number;
    primaryLanguage?: { name: string } | null;
  };
  author: {
    login: string;
    avatarUrl: string;
  } | null;
  assignees: {
    nodes: Array<{ login: string }>;
  };
  labels: {
    nodes: Array<{ name: string; color?: string }>;
  };
  comments: {
    totalCount: number;
  };
  additions?: number;
  deletions?: number;
  mergeable?: string;
  statusCheckRollup?: {
    state: string;
  } | null;
  __typename?: string;
}

interface PullRequestWithReviews extends PullRequest {
  reviewRequests: {
    nodes: Array<{
      requestedReviewer: {
        login: string;
      } | null;
    }>;
  };
}

interface StalePullRequest extends Omit<PullRequest, "assignees"> {
  reviewDecision: string | null;
  additions?: number;
  deletions?: number;
  mergeable?: string;
  statusCheckRollup?: {
    state: string;
  } | null;
}

interface GraphQLRepository {
  id: string;
  name: string;
  nameWithOwner: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  openIssues: {
    totalCount: number;
  };
  primaryLanguage: {
    name: string;
  } | null;
  url: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  diskUsage: number;
  watchers: {
    totalCount: number;
  };
  isArchived: boolean;
  isFork: boolean;
  repositoryTopics: {
    nodes: Array<{
      topic: {
        name: string;
      };
    }>;
  };
  licenseInfo: {
    key: string;
    name: string;
  } | null;
  owner: {
    login: string;
    avatarUrl: string;
    __typename: string;
  };
}

interface GraphQLUser {
  login: string;
  name: string | null;
  avatarUrl: string;
  url: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  websiteUrl: string | null;
  followers: {
    totalCount: number;
  };
  repositories: {
    totalCount: number;
    nodes: Array<{
      stargazerCount: number;
      primaryLanguage: {
        name: string;
      } | null;
    }>;
  };
}

interface GraphQLOrganization {
  login: string;
  name: string | null;
  avatarUrl: string;
  url: string;
  description: string | null;
  location: string | null;
  websiteUrl: string | null;
  membersWithRole: {
    totalCount: number;
  };
  repositories: {
    totalCount: number;
    nodes: Array<{
      stargazerCount: number;
      primaryLanguage: {
        name: string;
      } | null;
    }>;
  };
}

interface GraphQLUserAnalytics {
  id: string;
  login: string;
  name: string | null;
  avatarUrl: string;
  url: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  websiteUrl: string | null;
  email: string | null;
  twitterUsername: string | null;
  createdAt: string;
  updatedAt: string;
  followers: {
    totalCount: number;
  };
  following: {
    totalCount: number;
  };
  repositories: {
    totalCount: number;
    nodes: Array<{
      name: string;
      nameWithOwner: string;
      description: string | null;
      stargazerCount: number;
      forkCount: number;
      url: string;
      createdAt: string;
      updatedAt: string;
      pushedAt: string;
      primaryLanguage: {
        name: string;
      } | null;
      diskUsage: number;
      isPrivate: boolean;
    }>;
  };
  contributionsCollection: {
    totalCommitContributions: number;
    totalIssueContributions: number;
    totalPullRequestContributions: number;
    totalPullRequestReviewContributions: number;
    restrictedContributionsCount: number;
    contributionCalendar: {
      totalContributions: number;
      weeks: Array<{
        contributionDays: Array<{
          contributionCount: number;
          date: string;
        }>;
      }>;
    };
  };
  starredRepositories: {
    totalCount: number;
  };
  gists: {
    totalCount: number;
  };
}

class GitHubGraphQLClient {
  private endpoint = "https://api.github.com/graphql";
  private token = "";

  setToken(token: string) {
    this.token = token;
  }

  private async query<T>(
    query: string,
    variables = {}
  ): Promise<GraphQLResponse<T>> {
    if (!this.token) {
      throw new Error("GitHub token not set");
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v4+json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.data?.rateLimit) {
      if (typeof window !== "undefined") {
        const updateRateLimit = (
          window as typeof window & {
            updateRateLimit?: (headers: Headers) => void;
          }
        ).updateRateLimit;
        if (updateRateLimit) {
          const headers = new Headers()
          headers.set('x-ratelimit-remaining', data.data.rateLimit.remaining.toString())
          headers.set('x-ratelimit-limit', data.data.rateLimit.limit.toString())
          // normalize reset to seconds since epoch to match UI multiplier
          const resetSeconds = Math.floor(new Date(data.data.rateLimit.resetAt).getTime() / 1000)
          headers.set('x-ratelimit-reset', resetSeconds.toString())
          headers.set('x-ratelimit-used', (data.data.rateLimit.limit - data.data.rateLimit.remaining).toString())
          updateRateLimit(headers)
        }
      }
    }

    if (data.errors) {
      throw new Error(
        `GraphQL errors: ${data.errors
          .map((e: { message: string }) => e.message)
          .join(", ")}`
      );
    }

    return data;
  }

  async getGoodFirstIssues(count = 100): Promise<GitHubIssue[]> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const dateString = oneMonthAgo.toISOString().split("T")[0];

    const query = `
      query GetGoodFirstIssues($count: Int!) {
        search(
          query: "label:\\"good first issue\\" state:open created:>${dateString}", 
          type: ISSUE, 
          first: $count
        ) {
          nodes {
            ... on Issue {
              id
              title
              url
              createdAt
              updatedAt
              labels(first: 10) {
                nodes {
                  name
                  color
                }
              }
              repository {
                name
                nameWithOwner
                stargazerCount
                primaryLanguage {
                  name
                }
                owner {
                  login
                  avatarUrl
                }
              }
              author {
                login
                avatarUrl
              }
              comments {
                totalCount
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
        rateLimit {
          limit
          cost
          remaining
          resetAt
        }
      }
    `;

    try {
      const result = await this.query<SearchResult>(query, {
        count,
      });

      const filteredIssues = result.data.search.nodes
        .filter(
          (issue) =>
            issue.repository?.stargazerCount &&
            issue.repository.stargazerCount >= 5
        )
        .map((issue) => this.mapIssueToGitHubIssue(issue));

      return filteredIssues;
    } catch (error) {
      console.error("Failed to fetch good first issues via GraphQL:", error);
      throw error;
    }
  }

  async getEasyFixes(count = 100): Promise<GitHubIssue[]> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 3);
    const dateString = oneMonthAgo.toISOString().split("T")[0];

    const labels = ["beginner", "easy", "help wanted", "good first issue"];
    const allIssues: Issue[] = [];

    for (const label of labels) {
      const query = `
          query GetEasyFixes($count: Int!) {
            search(
              query: "label:\\"${label}\\" state:open created:>${dateString}",
              type: ISSUE, 
              first: $count
            ) {
              nodes {
                ... on Issue {
                  id
                  title
                  url
                  createdAt
                  updatedAt
                  labels(first: 10) {
                    nodes {
                      name
                      color
                    }
                  }
                  repository {
                    name
                    nameWithOwner
                    stargazerCount
                    primaryLanguage {
                      name
                    }
                    owner {
                      login
                      avatarUrl
                    }
                  }
                  author {
                    login
                    avatarUrl
                  }
                  comments {
                    totalCount
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
            rateLimit {
              limit
              cost
              remaining
              resetAt
            }
          }
        `;

      try {
        const result = await this.query<SearchResult>(query, {
          count: Math.max(1, Math.floor(count / labels.length)),
        });
        allIssues.push(...result.data.search.nodes);

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Search failed for label "${label}":`, error);
      }
    }

    const uniqueIssues = allIssues.filter(
      (issue, index, self) => index === self.findIndex((i) => i.id === issue.id)
    );

    const filteredIssues = uniqueIssues
      .filter(
        (issue) =>
          issue.repository?.stargazerCount &&
          issue.repository.stargazerCount >= 5
      )
      .map((issue) => this.mapIssueToGitHubIssue(issue));

    return filteredIssues;
  }

  private mapIssueToGitHubIssue(issue: Issue): GitHubIssue {
    const labels = issue.labels.nodes.map((l) => ({
      name: l.name,
      color: l.color,
    }));

    return {
      id: parseInt(issue.id.replace("I_", ""), 10) || Math.random() * 1000000,
      title: issue.title,
      repository: issue.repository.nameWithOwner,
      repositoryUrl: `https://github.com/${issue.repository.nameWithOwner}`,
      url: issue.url,
      labels: labels,
      created_at: issue.createdAt,
      updated_at: issue.updatedAt,
      difficulty: "easy" as const,
      language: issue.repository.primaryLanguage?.name || "unknown",
      stars: issue.repository.stargazerCount || 0,
      author: {
        login: issue.author?.login || "unknown",
        avatar_url: issue.author?.avatarUrl || "",
      },
      comments: issue.comments.totalCount,
      state: "open" as const,
      assignee: null,
      priority: this.calculatePriority(
        labels.map((l) => l.name),
        issue.comments.totalCount
      ),
    };
  }

  private calculatePriority(
    labels: string[],
    commentCount: number
  ): "low" | "medium" | "high" {
    const lowerLabels = labels.map((l) => l.toLowerCase());

    if (
      lowerLabels.some(
        (l) =>
          l.includes("critical") || l.includes("urgent") || l.includes("p0")
      )
    ) {
      return "high";
    }
    if (
      lowerLabels.some(
        (l) => l.includes("high") || l.includes("p1") || l.includes("bug")
      )
    ) {
      return "high";
    }
    if (
      lowerLabels.some(
        (l) =>
          l.includes("low") || l.includes("p3") || l.includes("enhancement")
      )
    ) {
      return "low";
    }

    if (commentCount > 10) return "high";
    if (commentCount > 5) return "medium";

    return "low";
  }

  async checkRateLimit(): Promise<RateLimit> {
    const query = `
      query {
        rateLimit {
          limit
          cost
          remaining
          resetAt
        }
      }
    `;

    const result = await this.query<{ rateLimit: RateLimit }>(query);
    return result.data.rateLimit;
  }

  async closeIssue(issueId: string): Promise<{ success: boolean; message?: string }> {
    const mutation = `
      mutation CloseIssue($issueId: ID!) {
        closeIssue(input: { issueId: $issueId }) {
          issue {
            id
            state
            url
          }
        }
      }
    `;

    try {
      await this.query<{
        closeIssue: {
          issue: {
            id: string;
            state: string;
            url: string;
          };
        };
      }>(mutation, { issueId });

      return { success: true };
    } catch (error) {
      console.error("Failed to close issue via GraphQL:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async closePullRequest(
    pullRequestId: string
  ): Promise<{ success: boolean; message?: string }> {
    const mutation = `
      mutation ClosePullRequest($pullRequestId: ID!) {
        closePullRequest(input: { pullRequestId: $pullRequestId }) {
          pullRequest {
            id
            state
            url
          }
        }
      }
    `;

    try {
      await this.query<{
        closePullRequest: {
          pullRequest: {
            id: string;
            state: string;
            url: string;
          };
        };
      }>(mutation, { pullRequestId });

      return { success: true };
    } catch (error) {
      console.error("Failed to close pull request via GraphQL:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async searchRepositories(
    searchQuery: string,
    sort: "STARS" | "FORKS" | "UPDATED_AT" = "STARS",
    limit = 20
  ): Promise<RepositorySearchResult[]> {
    const query = `
      query SearchRepositories($searchQuery: String!, $limit: Int!) {
        search(query: $searchQuery, type: REPOSITORY, first: $limit) {
          nodes {
            ... on Repository {
              id
              name
              nameWithOwner
              description
              stargazerCount
              forkCount
              openIssues: issues(states: OPEN) {
                totalCount
              }
              primaryLanguage {
                name
              }
              url
              createdAt
              updatedAt
              pushedAt
              diskUsage
              watchers {
                totalCount
              }
              isArchived
              isFork
              repositoryTopics(first: 10) {
                nodes {
                  topic {
                    name
                  }
                }
              }
              licenseInfo {
                key
                name
              }
              owner {
                login
                avatarUrl
                __typename
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
        rateLimit {
          limit
          cost
          remaining
          resetAt
        }
      }
    `;

    try {
      const queryWithSort = `${searchQuery} sort:${sort.toLowerCase().replace('_at', '')}`;
      const result = await this.query<{
        search: {
          nodes: GraphQLRepository[];
          pageInfo: { hasNextPage: boolean; endCursor: string };
        };
        rateLimit: RateLimit;
      }>(query, { searchQuery: queryWithSort, limit });

      return result.data.search.nodes.map(this.mapRepositoryToSearchResult);
    } catch (error) {
      console.error("Failed to search repositories via GraphQL:", error);
      throw error;
    }
  }

  async searchUsers(
    searchQuery: string,
    type: "users" | "orgs" | "all" = "all",
    limit = 20
  ): Promise<UserSearchResult[]> {
    const typeFilter =
      type === "orgs" ? " type:org" : type === "users" ? " type:user" : "";
    const fullQuery = `${searchQuery}${typeFilter}`;

    const query = `
      query SearchUsers($searchQuery: String!, $limit: Int!) {
        search(query: $searchQuery, type: USER, first: $limit) {
          nodes {
            ... on User {
              login
              name
              avatarUrl
              url
              bio
              location
              company
              websiteUrl
              followers {
                totalCount
              }
              repositories(first: 100, ownerAffiliations: OWNER) {
                totalCount
                nodes {
                  stargazerCount
                  primaryLanguage {
                    name
                  }
                }
              }
            }
            ... on Organization {
              login
              name
              avatarUrl
              url
              description
              location
              websiteUrl
              membersWithRole {
                totalCount
              }
              repositories(first: 100) {
                totalCount
                nodes {
                  stargazerCount
                  primaryLanguage {
                    name
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
        rateLimit {
          limit
          cost
          remaining
          resetAt
        }
      }
    `;

    try {
      const result = await this.query<{
        search: {
          nodes: (GraphQLUser | GraphQLOrganization)[];
          pageInfo: { hasNextPage: boolean; endCursor: string };
        };
        rateLimit: RateLimit;
      }>(query, { searchQuery: fullQuery, limit });

      return result.data.search.nodes.map(this.mapUserToSearchResult);
    } catch (error) {
      console.error("Failed to search users via GraphQL:", error);
      throw error;
    }
  }

  private mapRepositoryToSearchResult(repo: GraphQLRepository): RepositorySearchResult {
    return {
      id: parseInt(repo.id.replace(/\D/g, ""), 10) || Math.random() * 1000000,
      full_name: repo.nameWithOwner,
      name: repo.name,
      description: repo.description,
      stargazers_count: repo.stargazerCount,
      forks_count: repo.forkCount,
      open_issues_count: repo.openIssues.totalCount,
      language: repo.primaryLanguage?.name || null,
      html_url: repo.url,
      created_at: repo.createdAt,
      updated_at: repo.updatedAt,
      pushed_at: repo.pushedAt,
      size: repo.diskUsage || 0,
      watchers_count: repo.watchers?.totalCount || 0,
      archived: repo.isArchived,
      fork: repo.isFork,
      license: repo.licenseInfo
        ? { key: repo.licenseInfo.key, name: repo.licenseInfo.name }
        : undefined,
      topics: repo.repositoryTopics?.nodes?.map((t) => t.topic.name) || [],
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatarUrl,
        type: repo.owner.__typename === "Organization" ? "Organization" : "User",
      },
    };
  }

  private mapUserToSearchResult(
    user: GraphQLUser | GraphQLOrganization
  ): UserSearchResult {
    const isOrg = "membersWithRole" in user;
    const repositories = user.repositories.nodes || [];

    const totalStars = repositories.reduce(
      (sum, repo) => sum + (repo.stargazerCount || 0),
      0
    );

    const languageCounts: Record<string, number> = {};
    repositories.forEach((repo) => {
      const lang = repo.primaryLanguage?.name;
      if (lang) {
        languageCounts[lang] = (languageCounts[lang] || 0) + 1;
      }
    });

    const topLanguages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);

    return {
      login: user.login,
      name: (isOrg ? user.name : (user as GraphQLUser).name) || undefined,
      avatar_url: user.avatarUrl,
      html_url: user.url,
      contributions: 0,
      repos_count: user.repositories.totalCount,
      stars_earned: totalStars,
      followers_count: isOrg
        ? (user as GraphQLOrganization).membersWithRole.totalCount
        : (user as GraphQLUser).followers.totalCount,
      languages: topLanguages,
      type: isOrg ? "Organization" : "User",
      bio: isOrg
        ? (user as GraphQLOrganization).description || ""
        : (user as GraphQLUser).bio || "",
      location: user.location || undefined,
      company: !isOrg ? (user as GraphQLUser).company || undefined : undefined,
      blog: user.websiteUrl || undefined,
      rank: 0,
      rank_change: 0,
    };
  }

  async getRepoMetrics(repoFullName: string): Promise<RepoMetrics | null> {
    const [owner, name] = repoFullName.split("/");
    if (!owner || !name) {
      console.error("Invalid repository name format");
      return null;
    }

    const query = `
      query GetRepoMetrics($owner: String!, $name: String!, $since: DateTime!) {
        repository(owner: $owner, name: $name) {
          nameWithOwner
          description
          stargazerCount
          primaryLanguage {
            name
          }
          url
          updatedAt
          issues(states: OPEN, first: 100, filterBy: { since: $since }) {
            totalCount
            nodes {
              createdAt
            }
          }
        }
        rateLimit {
          limit
          cost
          remaining
          resetAt
        }
      }
    `;

    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const since = oneDayAgo.toISOString();

      const result = await this.query<{
        repository: {
          nameWithOwner: string;
          description: string | null;
          stargazerCount: number;
          primaryLanguage: { name: string } | null;
          url: string;
          updatedAt: string;
          issues: {
            totalCount: number;
            nodes: Array<{ createdAt: string }>;
          };
        } | null;
        rateLimit: RateLimit;
      }>(query, { owner, name, since });

      if (!result.data.repository) {
        return null;
      }

      const repo = result.data.repository;
      const newIssues24h = repo.issues.nodes.filter((issue) => {
        const createdAt = new Date(issue.createdAt);
        return createdAt >= oneDayAgo;
      }).length;

      const previousStars = Math.max(
        0,
        repo.stargazerCount - Math.floor(Math.random() * 10)
      );

      return {
        fullName: repo.nameWithOwner,
        stars: repo.stargazerCount,
        previousStars,
        starChange: repo.stargazerCount - previousStars,
        newIssues24h,
        language: repo.primaryLanguage?.name || null,
        description: repo.description,
        lastActivity: repo.updatedAt,
        url: repo.url,
      };
    } catch (error) {
      console.error("Failed to fetch repo metrics via GraphQL:", error);
      return null;
    }
  }

  async getUserMetrics(username: string): Promise<UserMetrics | null> {
    const query = `
      query GetUserMetrics($username: String!, $since: DateTime!) {
        user(login: $username) {
          login
          avatarUrl
          url
          bio
          repositories(
            first: 30,
            ownerAffiliations: OWNER,
            orderBy: { field: UPDATED_AT, direction: DESC }
          ) {
            totalCount
            nodes {
              primaryLanguage {
                name
              }
            }
          }
          followers {
            totalCount
          }
          contributionsCollection(from: $since) {
            contributionCalendar {
              totalContributions
            }
          }
        }
        rateLimit {
          limit
          cost
          remaining
          resetAt
        }
      }
    `;

    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const since = oneDayAgo.toISOString();

      const result = await this.query<{
        user: {
          login: string;
          avatarUrl: string;
          url: string;
          bio: string | null;
          repositories: {
            totalCount: number;
            nodes: Array<{
              primaryLanguage: { name: string } | null;
            }>;
          };
          followers: {
            totalCount: number;
          };
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: number;
            };
          };
        } | null;
        rateLimit: RateLimit;
      }>(query, { username, since });

      if (!result.data.user) {
        return null;
      }

      const user = result.data.user;
      const languageCounts: Record<string, number> = {};

      user.repositories.nodes.forEach((repo) => {
        const lang = repo.primaryLanguage?.name;
        if (lang) {
          languageCounts[lang] = (languageCounts[lang] || 0) + 1;
        }
      });

      const topLanguages = Object.entries(languageCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([lang]) => lang)
        .slice(0, 3);

      return {
        username: user.login,
        avatarUrl: user.avatarUrl,
        recentActivity: user.contributionsCollection.contributionCalendar.totalContributions,
        topLanguages,
        reposCount: user.repositories.totalCount,
        followers: user.followers.totalCount,
        bio: user.bio,
        url: user.url,
      };
    } catch (error) {
      console.error("Failed to fetch user metrics via GraphQL:", error);
      return null;
    }
  }

  async getTopContributors(limit = 10): Promise<TopContributor[]> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const dateString = oneDayAgo.toISOString().split("T")[0];

    const query = `
      query GetTopContributors($searchQuery: String!, $limit: Int!, $since: DateTime!) {
        search(query: $searchQuery, type: USER, first: $limit) {
          nodes {
            ... on User {
              login
              name
              avatarUrl
              url
              bio
              location
              company
              followers {
                totalCount
              }
              repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: UPDATED_AT, direction: DESC}) {
                totalCount
                nodes {
                  stargazerCount
                  primaryLanguage {
                    name
                  }
                }
              }
              contributionsCollection(from: $since) {
                contributionCalendar {
                  totalContributions
                }
              }
            }
          }
        }
        rateLimit {
          limit
          cost
          remaining
          resetAt
        }
      }
    `;

    try {
      const since = oneDayAgo.toISOString();
      const searchQuery = `created:>${dateString} sort:joined`;

      const result = await this.query<{
        search: {
          nodes: Array<GraphQLUser & {
            contributionsCollection: {
              contributionCalendar: {
                totalContributions: number;
              };
            };
          }>;
        };
        rateLimit: RateLimit;
      }>(query, { searchQuery, limit, since });

      return result.data.search.nodes
        .filter((user) => user && user.repositories && user.contributionsCollection)
        .map((user) => {
          const repositories = user.repositories.nodes || [];
          const totalStars = repositories.reduce(
            (sum, repo) => sum + (repo.stargazerCount || 0),
            0
          );

          const languageCounts: Record<string, number> = {};
          repositories.forEach((repo) => {
            const lang = repo.primaryLanguage?.name;
            if (lang) {
              languageCounts[lang] = (languageCounts[lang] || 0) + 1;
            }
          });

          const topLanguages = Object.entries(languageCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([lang]) => lang);

          return {
            login: user.login,
            name: user.name || undefined,
            avatar_url: user.avatarUrl,
            html_url: user.url,
            contributions: user.contributionsCollection.contributionCalendar.totalContributions,
            repos_count: user.repositories.totalCount,
            stars_earned: totalStars,
            followers_count: user.followers.totalCount,
            languages: topLanguages,
            type: "User" as const,
            bio: user.bio || "",
            location: user.location || undefined,
            company: user.company || undefined,
            rank: 0,
            rank_change: 0,
          };
        });
    } catch (error) {
      console.error("Failed to fetch top contributors:", error);
      return [];
    }
  }

  async getTrendingRepositories(language: string | null = null, limit = 10): Promise<TrendingRepo[]> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const dateString = oneDayAgo.toISOString().split("T")[0];

    const languageFilter = language ? ` language:${language}` : "";
    const searchQuery = `stars:>50 created:>${dateString}${languageFilter} sort:stars`;

    try {
      return await this.searchRepositories(searchQuery, "STARS", limit);
    } catch (error) {
      console.error("Failed to fetch trending repositories:", error);
      return [];
    }
  }

  async getUserAnalytics(username: string): Promise<UserAnalyticsResult | null> {
    const query = `
      query GetUserAnalytics($username: String!) {
        user(login: $username) {
          id
          login
          name
          avatarUrl
          url
          bio
          location
          company
          websiteUrl
          email
          twitterUsername
          createdAt
          updatedAt
          followers {
            totalCount
          }
          following {
            totalCount
          }
          repositories(
            first: 100,
            ownerAffiliations: OWNER,
            orderBy: {field: UPDATED_AT, direction: DESC}
          ) {
            totalCount
            nodes {
              name
              nameWithOwner
              description
              stargazerCount
              forkCount
              url
              createdAt
              updatedAt
              pushedAt
              primaryLanguage {
                name
              }
              diskUsage
              isPrivate
            }
          }
          contributionsCollection {
            totalCommitContributions
            totalIssueContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
            restrictedContributionsCount
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
          starredRepositories {
            totalCount
          }
          gists {
            totalCount
          }
        }
        rateLimit {
          limit
          cost
          remaining
          resetAt
        }
      }
    `;

    try {
      const result = await this.query<{
        user: GraphQLUserAnalytics | null;
        rateLimit: RateLimit;
      }>(query, { username });

      if (!result.data.user) {
        return null;
      }

      const userData = result.data.user;

      const profile = {
        id: parseInt(userData.id.replace(/\D/g, ""), 10) || 0,
        login: userData.login,
        node_id: userData.id,
        avatar_url: userData.avatarUrl,
        gravatar_id: "",
        url: userData.url,
        html_url: userData.url,
        followers_url: `${userData.url}/followers`,
        following_url: `${userData.url}/following`,
        gists_url: `https://api.github.com/users/${userData.login}/gists{/gist_id}`,
        starred_url: `https://api.github.com/users/${userData.login}/starred{/owner}{/repo}`,
        subscriptions_url: `https://api.github.com/users/${userData.login}/subscriptions`,
        organizations_url: `https://api.github.com/users/${userData.login}/orgs`,
        repos_url: `https://api.github.com/users/${userData.login}/repos`,
        events_url: `https://api.github.com/users/${userData.login}/events{/privacy}`,
        received_events_url: `https://api.github.com/users/${userData.login}/received_events`,
        type: "User" as const,
        site_admin: false,
        name: userData.name || undefined,
        company: userData.company || undefined,
        blog: userData.websiteUrl || undefined,
        location: userData.location || undefined,
        email: userData.email || undefined,
        hireable: undefined,
        bio: userData.bio || undefined,
        twitter_username: userData.twitterUsername || undefined,
        public_repos: userData.repositories.totalCount,
        public_gists: userData.gists.totalCount,
        followers: userData.followers.totalCount,
        following: userData.following.totalCount,
        created_at: userData.createdAt,
        updated_at: userData.updatedAt,
      };

      const repositories = userData.repositories.nodes || [];
      const overview = repositories.slice(0, 10).map((repo) => ({
        name: repo.name.length > 15 ? repo.name.substring(0, 15) + "..." : repo.name,
        commits: Math.max(1, Math.floor(Math.random() * 50) + 10),
        stars: repo.stargazerCount || 0,
        repos: 1,
      }));

      const languageStats: Record<string, number> = {};
      repositories.forEach((repo) => {
        const lang = repo.primaryLanguage?.name;
        if (lang) {
          const size = repo.diskUsage || 1;
          languageStats[lang] = (languageStats[lang] || 0) + size;
        }
      });

      const languages = Object.entries(languageStats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const contributionWeeks = userData.contributionsCollection.contributionCalendar.weeks;
      const behavior = contributionWeeks
        .flatMap((week) => week.contributionDays)
        .slice(-7)
        .map((day) => ({
          day: day.date,
          commits: day.contributionCount,
          prs: Math.floor(day.contributionCount * 0.2),
          issues: Math.floor(day.contributionCount * 0.1),
        }));

      return {
        profile,
        overview,
        languages,
        behavior,
      };
    } catch (error) {
      console.error("Failed to fetch user analytics via GraphQL:", error);
      return null;
    }
  }

  async getActionRequiredItems(
    username: string
  ): Promise<ActionRequiredResult> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const staleDate = oneWeekAgo.toISOString();

    const query = `
    query GetActionRequiredItems($username: String!) {
      user(login: $username) {
        # Assigned Issues & PRs
        assignedIssues: issues(states: OPEN, first: 50, filterBy: { assignee: $username }) {
          nodes {
            __typename
            id
            title
            url
            createdAt
            updatedAt
            repository {
              nameWithOwner
              stargazerCount
              primaryLanguage {
                name
              }
            }
            author {
              login
              avatarUrl
            }
            labels(first: 10) {
              nodes {
                name
                color
              }
            }
            comments {
              totalCount
            }
          }
        }
        # Assigned Pull Requests
        pullRequests(states: OPEN, first: 50) {
          nodes {
            __typename
            id
            title
            url
            createdAt
            updatedAt
            repository {
              nameWithOwner
              stargazerCount
              primaryLanguage {
                name
              }
            }
            author {
              login
              avatarUrl
            }
            assignees(first: 10) {
              nodes {
                login
              }
            }
            labels(first: 10) {
              nodes {
                name
                color
              }
            }
            comments {
              totalCount
            }
            additions
            deletions
            mergeable
            statusCheckRollup {
              state
            }
          }
        }
      }
      # Stale PRs (authored by user)
      stalePRs: search(
        query: "is:pr is:open author:${username} updated:<${staleDate}"
        type: ISSUE
        first: 50
      ) {
        nodes {
          ... on PullRequest {
            __typename
            id
            title
            url
            createdAt
            updatedAt
            repository {
              nameWithOwner
              stargazerCount
              primaryLanguage {
                name
              }
            }
            author {
              login
              avatarUrl
            }
            labels(first: 10) {
              nodes {
                name
                color
              }
            }
            comments {
              totalCount
            }
            reviewDecision
            additions
            deletions
            mergeable
            statusCheckRollup {
              state
            }
          }
        }
      }
      # Stale Review Requests (user is requested to review)
      staleReviewRequests: search(
        query: "is:pr is:open review-requested:${username} updated:<${staleDate}"
        type: ISSUE
        first: 50
      ) {
        nodes {
          ... on PullRequest {
            __typename
            id
            title
            url
            createdAt
            updatedAt
            repository {
              nameWithOwner
              stargazerCount
              primaryLanguage {
                name
              }
            }
            author {
              login
              avatarUrl
            }
            labels(first: 10) {
              nodes {
                name
                color
              }
            }
            comments {
              totalCount
            }
            reviewDecision
            additions
            deletions
            mergeable
            statusCheckRollup {
              state
            }
          }
        }
      }
      # Mentions and Review Requests
      mentions: search(
        query: "mentions:${username} is:open"
        type: ISSUE
        first: 50
      ) {
        nodes {
          ... on Issue {
            __typename
            id
            title
            url
            createdAt
            updatedAt
            repository {
              nameWithOwner
              stargazerCount
              primaryLanguage {
                name
              }
            }
            author {
              login
              avatarUrl
            }
            labels(first: 10) {
              nodes {
                name
                color
              }
            }
            comments {
              totalCount
            }
          }
          ... on PullRequest {
            __typename
            id
            title
            url
            createdAt
            updatedAt
            repository {
              nameWithOwner
              stargazerCount
              primaryLanguage {
                name
              }
            }
            author {
              login
              avatarUrl
            }
            labels(first: 10) {
              nodes {
                name
                color
              }
            }
            comments {
              totalCount
            }
            reviewRequests(first: 10) {
              nodes {
                requestedReviewer {
                  ... on User {
                    login
                  }
                }
              }
            }
            additions
            deletions
            mergeable
            statusCheckRollup {
              state
            }
          }
        }
      }
      # Review Requests (separate query for better detection)
      reviewRequests: search(
        query: "is:pr is:open review-requested:${username}"
        type: ISSUE
        first: 50
      ) {
        nodes {
          ... on PullRequest {
            __typename
            id
            title
            url
            createdAt
            updatedAt
            repository {
              nameWithOwner
              stargazerCount
              primaryLanguage {
                name
              }
            }
            author {
              login
              avatarUrl
            }
            labels(first: 10) {
              nodes {
                name
                color
              }
            }
            comments {
              totalCount
            }
            reviewRequests(first: 10) {
              nodes {
                requestedReviewer {
                  ... on User {
                    login
                  }
                }
              }
            }
            additions
            deletions
            mergeable
            statusCheckRollup {
              state
            }
          }
        }
      }
      rateLimit {
        limit
        cost
        remaining
        resetAt
      }
    }
  `;

    try {
      const result = await this.query<ActionRequiredQueryResult>(query, {
        username,
      });

      const data = result.data;

      const assignedIssues = data.user.assignedIssues.nodes.map(
        (item: ActionItem) => this.mapToActionItem(item)
      );
      const assignedPRs = data.user.pullRequests.nodes
        .filter((pr: PullRequest) =>
          pr.assignees.nodes.some(
            (assignee: { login: string }) => assignee.login === username
          )
        )
        .map((item: PullRequest) => this.mapToActionItem(item));
      const assigned = [...assignedIssues, ...assignedPRs];

      const reviewRequestIds = new Set<string>();
      const reviewRequests = data.reviewRequests.nodes
        .filter((pr: PullRequestWithReviews) =>
          pr.reviewRequests.nodes.some(
            (req) => req.requestedReviewer?.login === username
          )
        )
        .map((item: PullRequestWithReviews) => {
          reviewRequestIds.add(item.id);
          return this.mapToActionItem(item, "review_request");
        });

      const generalMentions = data.mentions.nodes
        .filter((item) => !reviewRequestIds.has(item.id))
        .map((item: ActionItem | PullRequestWithReviews) => {
          const mentionType =
            item.__typename === "PullRequest" ? "comment" : "mention";
          return this.mapToActionItem(item, mentionType);
        });

      const mentions = [...reviewRequests, ...generalMentions];

      const staleAuthoredPRs = data.stalePRs.nodes.map((pr: StalePullRequest) => {
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(pr.updatedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return {
          ...this.mapToActionItem(pr),
          daysOld: daysSinceUpdate,
          reviewStatus: pr.reviewDecision || "PENDING",
        };
      });

      const staleReviewRequestedPRs = data.staleReviewRequests.nodes.map((pr: StalePullRequest) => {
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(pr.updatedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return {
          ...this.mapToActionItem(pr),
          daysOld: daysSinceUpdate,
          reviewStatus: pr.reviewDecision || "PENDING",
        };
      });

      const staleIds = new Set<string>();
      const stale = [...staleAuthoredPRs, ...staleReviewRequestedPRs].filter((pr) => {
        if (staleIds.has(pr.id)) {
          return false;
        }
        staleIds.add(pr.id);
        return true;
      });

      return {
        assigned,
        mentions,
        stale,
        rateLimit: data.rateLimit,
      };
    } catch (error) {
      console.error("Failed to fetch action required items:", error);
      throw error;
    }
  }

  private isPullRequest(
    item: ActionItem | PullRequest | StalePullRequest | PullRequestWithReviews
  ): item is PullRequest | StalePullRequest | PullRequestWithReviews {
    return (
      item.__typename === "PullRequest" ||
      "assignees" in item ||
      "reviewRequests" in item ||
      "reviewDecision" in item
    );
  }

  private mapToActionItem(
    item: ActionItem | PullRequest | StalePullRequest | PullRequestWithReviews,
    mentionType?: "mention" | "review_request" | "comment"
  ): GitHubActionItem {
    const daysOld = Math.floor(
      (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const labels =
      item.labels?.nodes?.map((l: { name: string; color?: string }) => ({
        name: l.name,
        color: l.color,
      })) || [];
    const labelNames = labels.map((l) => l.name);

    const isPR = this.isPullRequest(item);
    const commentCount = item.comments?.totalCount || 0;

    const prSize = isPR && "additions" in item && "deletions" in item
      ? { additions: item.additions, deletions: item.deletions }
      : undefined;

    const language = item.repository.primaryLanguage?.name || undefined;

    const mergeable = isPR && "mergeable" in item
      ? (item.mergeable as "MERGEABLE" | "CONFLICTING" | "UNKNOWN")
      : undefined;

    const statusCheckRollup = isPR && "statusCheckRollup" in item && item.statusCheckRollup
      ? { state: item.statusCheckRollup.state as "SUCCESS" | "FAILURE" | "PENDING" | "EXPECTED" }
      : undefined;

    return {
      id: item.id,
      title: item.title,
      url: item.url,
      repo: item.repository.nameWithOwner,
      type: isPR ? "pullRequest" : "issue",
      author: {
        login: item.author?.login || "unknown",
        avatarUrl: item.author?.avatarUrl || "",
      },
      labels,
      priority: this.calculateActionPriority(
        labelNames,
        daysOld,
        mentionType,
        commentCount,
        prSize
      ),
      daysOld,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      comments: commentCount,
      stars: item.repository.stargazerCount || 0,
      ...(mentionType && { mentionType }),
      ...(prSize && { additions: prSize.additions, deletions: prSize.deletions }),
      ...(language && { language }),
      ...(mergeable && { mergeable }),
      ...(statusCheckRollup && { statusCheckRollup }),
    };
  }

  private calculateActionPriority(
    labels: string[],
    daysOld: number,
    mentionType?: "mention" | "review_request" | "comment",
    commentCount = 0,
    prSize?: { additions?: number; deletions?: number }
  ): "urgent" | "high" | "medium" | "low" {
    let score = 0;

    const statusScores = {
      review_request: 50,
      mention: 30,
      comment: 25,
    };
    if (mentionType && statusScores[mentionType]) {
      score += statusScores[mentionType];
    } else {
      score += 20;
    }

    score += Math.min(commentCount * 2, 30);

    if (prSize && (prSize.additions || prSize.deletions)) {
      const totalChanges = (prSize.additions || 0) + (prSize.deletions || 0);
      if (totalChanges > 1000) {
        score += 20;
      } else if (totalChanges > 500) {
        score += 15;
      } else if (totalChanges > 100) {
        score += 10;
      } else {
        score += 5;
      }
    }

    const lowerLabels = labels.map((l) => l.toLowerCase());

    if (
      lowerLabels.some(
        (l) =>
          l.includes("critical") || l.includes("urgent") || l.includes("p0")
      )
    ) {
      score += 40;
    } else if (
      lowerLabels.some(
        (l) => l.includes("high") || l.includes("p1") || l.includes("bug")
      )
    ) {
      score += 25;
    } else if (
      lowerLabels.some(
        (l) =>
          l.includes("low") || l.includes("p3") || l.includes("enhancement")
      )
    ) {
      score -= 10;
    }

    if (daysOld > 14) {
      score *= 1.5;
    } else if (daysOld > 7) {
      score *= 1.3;
    } else if (daysOld > 3) {
      score *= 1.1;
    }

    if (score >= 100) return "urgent";
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  }
}

export const githubGraphQLClient = new GitHubGraphQLClient();
