"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { githubAPIClient } from "@/lib/api/github-api-client";
import { usePinnedTemplatesStore, type PinnedRepo, type PinnedUser, type PinnedOrg } from "@/stores/pinnedTemplates";
import { useAuthStore } from "@/stores/auth";
import { AlertCircle, Loader2 } from "lucide-react";

interface AddPinnedTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPinnedTemplateDialog({
  open,
  onOpenChange,
}: AddPinnedTemplateDialogProps) {
  const [activeTab, setActiveTab] = useState<"repo" | "user" | "org">("repo");
  const [repoInput, setRepoInput] = useState("");
  const [userInput, setUserInput] = useState("");
  const [orgInput, setOrgInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addPinnedRepo, addPinnedUser, addPinnedOrg } = usePinnedTemplatesStore();
  const orgData = useAuthStore((state) => state.orgData);

  const handleAddRepo = async () => {
    if (!repoInput.trim()) {
      setError("Please enter a repository in format: owner/repo");
      return;
    }

    const [owner, repo] = repoInput.trim().split("/");
    if (!owner || !repo) {
      setError("Please enter repository in format: owner/repo");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      githubAPIClient.setUserToken(orgData?.token || "");
      const repos = await githubAPIClient.searchRepositories(`repo:${owner}/${repo}`, "stars", 1);

      if (repos.length === 0) {
        setError("Repository not found");
        return;
      }

      const repoData = repos[0];
      const pinnedRepo: PinnedRepo = {
        id: `${owner}/${repo}`,
        owner,
        repo,
        name: repoData.name,
        description: repoData.description || undefined,
        url: repoData.html_url,
        starred: false,
        watching: false,
        language: repoData.language || undefined,
        starCount: repoData.stargazers_count,
        lastUpdated: repoData.pushed_at || repoData.updated_at,
        pinnedAt: new Date().toISOString(),
      };

      addPinnedRepo(pinnedRepo);
      setRepoInput("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add repository");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!userInput.trim()) {
      setError("Please enter a GitHub username");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      githubAPIClient.setUserToken(orgData?.token || "");
      const users = await githubAPIClient.searchUsers(userInput.trim(), "users", 1);

      if (users.length === 0) {
        setError("User not found");
        return;
      }

      const userData = users[0];
      const pinnedUser: PinnedUser = {
        id: userData.login,
        username: userData.login,
        avatarUrl: userData.avatar_url,
        url: userData.html_url,
        following: false,
        bio: userData.bio || undefined,
        followers: userData.followers_count,
        publicRepos: 0,
        pinnedAt: new Date().toISOString(),
      };

      addPinnedUser(pinnedUser);
      setUserInput("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrg = async () => {
    if (!orgInput.trim()) {
      setError("Please enter an organization name");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      githubAPIClient.setUserToken(orgData?.token || "");
      const orgs = await githubAPIClient.searchUsers(orgInput.trim(), "orgs", 1);

      if (orgs.length === 0) {
        setError("Organization not found");
        return;
      }

      const orgData2 = orgs[0];
      const pinnedOrg: PinnedOrg = {
        id: orgData2.login,
        name: orgData2.login,
        url: orgData2.html_url,
        avatarUrl: orgData2.avatar_url,
        description: orgData2.bio || undefined,
        followers: orgData2.followers_count,
        pinnedAt: new Date().toISOString(),
      };

      addPinnedOrg(pinnedOrg);
      setOrgInput("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add organization");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pin a Template</DialogTitle>
          <DialogDescription>
            Add a repository, user, or organization to your pinned templates
            for easy access to analytics and interactions.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950 p-3 rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "repo" | "user" | "org")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="repo">Repository</TabsTrigger>
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="org">Organization</TabsTrigger>
          </TabsList>

          <TabsContent value="repo" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repo-input">Repository</Label>
              <Input
                id="repo-input"
                placeholder="owner/repo"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddRepo();
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter the repository in format: owner/repo
              </p>
            </div>
            <Button
              onClick={handleAddRepo}
              disabled={isLoading || !repoInput.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Repository"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="user" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-input">GitHub Username</Label>
              <Input
                id="user-input"
                placeholder="username"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddUser();
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter the GitHub username you want to track
              </p>
            </div>
            <Button
              onClick={handleAddUser}
              disabled={isLoading || !userInput.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add User"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="org" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-input">Organization Name</Label>
              <Input
                id="org-input"
                placeholder="organization"
                value={orgInput}
                onChange={(e) => setOrgInput(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddOrg();
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter the GitHub organization you want to track
              </p>
            </div>
            <Button
              onClick={handleAddOrg}
              disabled={isLoading || !orgInput.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Organization"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
