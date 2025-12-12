"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRequireAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Eye, GitFork, AlertCircle } from "lucide-react";
import { githubWriteClient } from "@/lib/api/github-write-client";
import { usePinnedTemplatesStore } from "@/stores/pinnedTemplates";
import { useAuthStore } from "@/stores/auth";

interface PageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

export default function RepoPinnedTemplate({ params: paramPromise }: PageProps) {
  const { isLoading: authLoading } = useRequireAuth();
  const [owner, setOwner] = useState<string>("");
  const [repo, setRepo] = useState<string>("");
  const [starred, setStarred] = useState(false);
  const [watching, setWatching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { updatePinnedRepo, getPinnedRepo } = usePinnedTemplatesStore();
  const orgData = useAuthStore((state) => state.orgData);

  useEffect(() => {
    paramPromise.then((params) => {
      setOwner(params.owner);
      setRepo(params.repo);
    });
  }, [paramPromise]);

  useEffect(() => {
    if (owner && repo) {
      const pinned = getPinnedRepo(owner, repo);
      if (pinned) {
        setStarred(pinned.starred);
        setWatching(pinned.watching);
      }
    }
  }, [owner, repo, getPinnedRepo]);

  const handleToggleStar = async () => {
    if (!orgData?.token || isLoading) return;
    setIsLoading(true);

    try {
      githubWriteClient.setUserToken(orgData.token);

      if (starred) {
        const result = await githubWriteClient.unstarRepository(owner, repo);
        if (result.success) {
          setStarred(false);
          updatePinnedRepo(`${owner}/${repo}`, { starred: false });
        }
      } else {
        const result = await githubWriteClient.starRepository(owner, repo);
        if (result.success) {
          setStarred(true);
          updatePinnedRepo(`${owner}/${repo}`, { starred: true });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWatch = async () => {
    if (!orgData?.token || isLoading) return;
    setIsLoading(true);

    try {
      githubWriteClient.setUserToken(orgData.token);
      const result = await githubWriteClient.watchRepository(
        owner,
        repo,
        !watching
      );
      if (result.success) {
        setWatching(!watching);
        updatePinnedRepo(`${owner}/${repo}`, { watching: !watching });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !owner || !repo) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading repository...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <PageHeader
          title={repo}
          description={`by ${owner}`}
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl">{`${owner}/${repo}`}</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={starred ? "default" : "outline"}
                onClick={handleToggleStar}
                disabled={isLoading}
                className="gap-2"
              >
                <Star
                  className="h-4 w-4"
                  fill={starred ? "currentColor" : "none"}
                />
                {starred ? "Starred" : "Star"}
              </Button>
              <Button
                size="sm"
                variant={watching ? "default" : "outline"}
                onClick={handleToggleWatch}
                disabled={isLoading}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {watching ? "Watching" : "Watch"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Stars</span>
              </div>
              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4" />
                <span>Forks</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span>Open Issues</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="volunteer" className="w-full">
          <TabsList>
            <TabsTrigger value="volunteer">Triage & Volunteer</TabsTrigger>
            <TabsTrigger value="context">My Context</TabsTrigger>
          </TabsList>

          <TabsContent value="volunteer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Good First Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Issues marked as good-first-issue in this repository
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="context" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your History in This Repo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Issues you opened, comments you made, and PRs you created
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
