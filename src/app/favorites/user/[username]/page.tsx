"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRequireAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, TrendingUp } from "lucide-react";
import { githubWriteClient } from "@/lib/api/github-write-client";
import { usePinnedTemplatesStore } from "@/stores/pinnedTemplates";
import { useAuthStore } from "@/stores/auth";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default function UserPinnedTemplate({ params: paramPromise }: PageProps) {
  const { isLoading: authLoading } = useRequireAuth();
  const [username, setUsername] = useState<string>("");
  const [following, setFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { updatePinnedUser, getPinnedUser } = usePinnedTemplatesStore();
  const orgData = useAuthStore((state) => state.orgData);

  useEffect(() => {
    paramPromise.then((params) => {
      setUsername(params.username);
    });
  }, [paramPromise]);

  useEffect(() => {
    if (username) {
      const pinned = getPinnedUser(username);
      if (pinned) {
        setFollowing(pinned.following);
      }
    }
  }, [username, getPinnedUser]);

  const handleToggleFollow = async () => {
    if (!orgData?.token || isLoading) return;
    setIsLoading(true);

    try {
      githubWriteClient.setUserToken(orgData.token);

      if (following) {
        const result = await githubWriteClient.unfollowUser(username);
        if (result.success) {
          setFollowing(false);
          updatePinnedUser(username, { following: false });
        }
      } else {
        const result = await githubWriteClient.followUser(username);
        if (result.success) {
          setFollowing(true);
          updatePinnedUser(username, { following: true });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !username) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading user profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <PageHeader
          title={username}
          description="GitHub Developer Profile"
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{username.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{username}</CardTitle>
                <p className="text-sm text-muted-foreground">GitHub Developer</p>
              </div>
            </div>
            <Button
              size="sm"
              variant={following ? "default" : "outline"}
              onClick={handleToggleFollow}
              disabled={isLoading}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              {following ? "Following" : "Follow"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">Repos</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">Stars Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="style" className="w-full">
          <TabsList>
            <TabsTrigger value="style">Contribution Style</TabsTrigger>
            <TabsTrigger value="compare">Compare vs Me</TabsTrigger>
          </TabsList>

          <TabsContent value="style" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Contribution Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Analyzing recent contributions and activity patterns
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compare" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Stats vs {username}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Side-by-side comparison of public GitHub metrics
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
