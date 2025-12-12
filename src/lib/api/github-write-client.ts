class GitHubWriteClient {
  private baseUrl = "https://api.github.com";
  private githubToken = "";

  setUserToken(token: string): void {
    this.githubToken = token;
  }

  hasValidToken(): boolean {
    return this.githubToken.length >= 20;
  }

  clearToken(): void {
    this.githubToken = "";
  }

  private getHeaders(): HeadersInit {
    return {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${this.githubToken}`,
      "User-Agent": "GitHubMon/1.0",
      "Content-Type": "application/json",
    };
  }

  private async fetchRequest<T>(
    method: "POST" | "PUT" | "DELETE",
    endpoint: string,
    body?: unknown
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    if (!this.hasValidToken()) {
      return { success: false, error: "No valid GitHub token available" };
    }

    try {
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, options);

      if (!response.ok) {
        const errorData = await response.text();
        console.error(
          `GitHub API Error: ${response.status} ${response.statusText}`,
          errorData
        );
        return {
          success: false,
          error: `GitHub API error: ${response.status} ${response.statusText}`,
        };
      }

      const contentLength = response.headers.get("content-length");
      if (contentLength === "0" || response.status === 204) {
        return { success: true };
      }

      const data = (await response.json()) as T;
      return { success: true, data };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("GitHub API request failed:", errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async starRepository(
    owner: string,
    repo: string
  ): Promise<{ success: boolean; error?: string }> {
    const endpoint = `/user/starred/${owner}/${repo}`;
    const result = await this.fetchRequest("PUT", endpoint);
    return { success: result.success, error: result.error };
  }

  async unstarRepository(
    owner: string,
    repo: string
  ): Promise<{ success: boolean; error?: string }> {
    const endpoint = `/user/starred/${owner}/${repo}`;
    const result = await this.fetchRequest("DELETE", endpoint);
    return { success: result.success, error: result.error };
  }

  async watchRepository(
    owner: string,
    repo: string,
    subscribed: boolean
  ): Promise<{ success: boolean; error?: string }> {
    const endpoint = `/user/subscriptions/${owner}/${repo}`;

    if (subscribed) {
      const result = await this.fetchRequest("PUT", endpoint, {
        subscribed: true,
        ignored: false,
      });
      return { success: result.success, error: result.error };
    } else {
      const result = await this.fetchRequest("DELETE", endpoint);
      return { success: result.success, error: result.error };
    }
  }

  async followUser(username: string): Promise<{ success: boolean; error?: string }> {
    const endpoint = `/user/following/${username}`;
    const result = await this.fetchRequest("PUT", endpoint);
    return { success: result.success, error: result.error };
  }

  async unfollowUser(username: string): Promise<{ success: boolean; error?: string }> {
    const endpoint = `/user/following/${username}`;
    const result = await this.fetchRequest("DELETE", endpoint);
    return { success: result.success, error: result.error };
  }

  async createIssueComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string
  ): Promise<{ success: boolean; commentUrl?: string; error?: string }> {
    const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}/comments`;
    const result = await this.fetchRequest<{ html_url: string }>(
      "POST",
      endpoint,
      { body }
    );
    return {
      success: result.success,
      commentUrl: result.data?.html_url,
      error: result.error,
    };
  }
}

export const githubWriteClient = new GitHubWriteClient();
