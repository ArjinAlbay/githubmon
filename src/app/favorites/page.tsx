"use client";

import { useRef, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRequireAuth } from "@/hooks/useAuth";
import { FavoritesList } from "@/components/widget/FavoritesList";
import { ActivityFeed } from "@/components/widget/ActivityFeed";
import { OpenSourceWarriors } from "@/components/favorites/OpenSourceWarriors";
import { TopContributedRepos } from "@/components/favorites/TopContributedRepos";
import { Recommendations } from "@/components/favorites/Recommendations";
import { PinnedRepoCard } from "@/components/favorites/PinnedRepoCard";
import { PinnedUserCard } from "@/components/favorites/PinnedUserCard";
import { PinnedOrgCard } from "@/components/favorites/PinnedOrgCard";
import { AddPinnedTemplateDialog } from "@/components/favorites/AddPinnedTemplateDialog";
import { usePinnedTemplatesStore } from "@/stores/pinnedTemplates";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Star, Plus } from "lucide-react";
import Link from "next/link";

export default function FavoritesPage() {
  const { isLoading } = useRequireAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    pinnedRepos,
    pinnedUsers,
    pinnedOrgs,
    removePinnedRepo,
    removePinnedUser,
    removePinnedOrg,
  } = usePinnedTemplatesStore();
  const [activeTab, setActiveTab] = useState("feed");
  const actionSectionRef = useRef<HTMLDivElement>(null);

  const hasRepoTemplates = pinnedRepos.length > 0;
  const hasUserTemplates = pinnedUsers.length > 0;
  const hasOrgTemplates = pinnedOrgs.length > 0;

  const handleOpenTemplateTab = (tabValue: string) => {
    setActiveTab(tabValue);
    actionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading favorites...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const totalPinned = pinnedRepos.length + pinnedUsers.length + pinnedOrgs.length;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <PageHeader title="Favorites" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" />
            <p className="text-muted-foreground">
              Track your favorite repositories and developers with live metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Pin Template
            </Button>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage Favorites
              </Button>
            </Link>
          </div>
        </div>

        {totalPinned > 0 && (
          <div className="space-y-6">
            {pinnedRepos.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Pinned Repositories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pinnedRepos.map((repo) => (
                    <PinnedRepoCard
                      key={repo.id}
                      repo={repo}
                      onRemove={removePinnedRepo}
                      disableNavigation
                      onSelect={() => handleOpenTemplateTab("repos")}
                    />
                  ))}
                </div>
              </div>
            )}

            {pinnedUsers.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Pinned Users</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pinnedUsers.map((user) => (
                    <PinnedUserCard
                      key={user.id}
                      user={user}
                      onRemove={removePinnedUser}
                      disableNavigation
                      onSelect={() => handleOpenTemplateTab("users")}
                    />
                  ))}
                </div>
              </div>
            )}

            {pinnedOrgs.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Pinned Organizations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pinnedOrgs.map((org) => (
                    <PinnedOrgCard
                      key={org.id}
                      org={org}
                      onRemove={removePinnedOrg}
                      disableNavigation
                      onSelect={() => handleOpenTemplateTab("orgs")}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6" ref={actionSectionRef}>
          <div className="flex-1 lg:w-[65%]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4 flex flex-wrap gap-2">
                <TabsTrigger value="feed">Action Feed</TabsTrigger>
                {hasRepoTemplates && <TabsTrigger value="repos">Repo Templates</TabsTrigger>}
                {hasUserTemplates && <TabsTrigger value="users">User Templates</TabsTrigger>}
                {hasOrgTemplates && <TabsTrigger value="orgs">Org Templates</TabsTrigger>}
              </TabsList>

              <TabsContent value="feed" className="space-y-4">
                <ActivityFeed />
              </TabsContent>

              <TabsContent value="repos" className="space-y-4">
                {hasRepoTemplates ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pinnedRepos.map((repo) => (
                      <PinnedRepoCard
                        key={repo.id}
                        repo={repo}
                        onRemove={removePinnedRepo}
                        disableNavigation
                      />
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 text-sm text-muted-foreground">
                    Pin a repository template to see it here.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                {hasUserTemplates ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pinnedUsers.map((user) => (
                      <PinnedUserCard
                        key={user.id}
                        user={user}
                        onRemove={removePinnedUser}
                        disableNavigation
                      />
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 text-sm text-muted-foreground">
                    Add a user template to surface it in this action space.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="orgs" className="space-y-4">
                {hasOrgTemplates ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pinnedOrgs.map((org) => (
                      <PinnedOrgCard
                        key={org.id}
                        org={org}
                        onRemove={removePinnedOrg}
                        disableNavigation
                      />
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 text-sm text-muted-foreground">
                    Add an organization template to keep it actionable here.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          <div className="lg:w-[35%] space-y-6">
            <FavoritesList />
            <Recommendations />
            <OpenSourceWarriors />
            <TopContributedRepos />
          </div>
        </div>
      </div>

      <AddPinnedTemplateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Layout>
  );
}
