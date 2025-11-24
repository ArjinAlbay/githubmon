"use client";

import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRequireAuth } from "@/hooks/useAuth";
import { FavoritesList } from "@/components/widget/FavoritesList";
import { ActivityFeed } from "@/components/widget/ActivityFeed";
import { OpenSourceWarriors } from "@/components/favorites/OpenSourceWarriors";
import { TopContributedRepos } from "@/components/favorites/TopContributedRepos";
import { Recommendations } from "@/components/favorites/Recommendations";
import { Button } from "@/components/ui/button";
import { Settings, Star } from "lucide-react";
import Link from "next/link";

export default function FavoritesPage() {
  const { isLoading } = useRequireAuth();

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
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Manage Favorites
            </Button>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 lg:w-[65%]">
            <ActivityFeed />
          </div>
          <div className="lg:w-[35%] space-y-6">
            <FavoritesList />
            <Recommendations />
            <OpenSourceWarriors />
            <TopContributedRepos />
          </div>
        </div>
      </div>
    </Layout>
  );
}
