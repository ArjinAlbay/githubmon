"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Eye, GitFork, AlertCircle, X } from "lucide-react";
import { githubWriteClient } from "@/lib/api/github-write-client";
import { usePinnedTemplatesStore, type PinnedRepo } from "@/stores/pinnedTemplates";
import { useAuthStore } from "@/stores/auth";

interface PinnedRepoCardProps {
  repo: PinnedRepo;
  onRemove?: (repoId: string) => void;
  onSelect?: () => void;
  disableNavigation?: boolean;
}

export function PinnedRepoCard({ repo, onRemove, onSelect, disableNavigation }: PinnedRepoCardProps) {
  const [starred, setStarred] = useState(repo.starred);
  const [watching, setWatching] = useState(repo.watching);
  const [isLoading, setIsLoading] = useState(false);
  const { updatePinnedRepo } = usePinnedTemplatesStore();
  const orgData = useAuthStore((state) => state.orgData);

  const handleToggleStar = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!orgData?.token || isLoading) return;
    setIsLoading(true);

    try {
      githubWriteClient.setUserToken(orgData.token);

      if (starred) {
        const result = await githubWriteClient.unstarRepository(
          repo.owner,
          repo.repo
        );
        if (result.success) {
          setStarred(false);
          updatePinnedRepo(repo.id, { starred: false });
        }
      } else {
        const result = await githubWriteClient.starRepository(
          repo.owner,
          repo.repo
        );
        if (result.success) {
          setStarred(true);
          updatePinnedRepo(repo.id, { starred: true });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWatch = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!orgData?.token || isLoading) return;
    setIsLoading(true);

    try {
      githubWriteClient.setUserToken(orgData.token);
      const result = await githubWriteClient.watchRepository(
        repo.owner,
        repo.repo,
        !watching
      );
      if (result.success) {
        setWatching(!watching);
        updatePinnedRepo(repo.id, { watching: !watching });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const daysSincePush = Math.floor(
    (Date.now() - new Date(repo.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
  );

  const getActivityBadge = () => {
    if (daysSincePush < 7) return { label: "Active", color: "bg-green-100 text-green-800" };
    if (daysSincePush < 30) return { label: "Maintained", color: "bg-blue-100 text-blue-800" };
    if (daysSincePush < 180) return { label: "Stale", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Abandoned", color: "bg-gray-100 text-gray-800" };
  };

  const activityBadge = getActivityBadge();

  const card = (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer h-full"
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{`${repo.owner}/${repo.repo}`}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {repo.description || "No description"}
            </p>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(repo.id);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className={activityBadge.color}>
            {activityBadge.label}
          </Badge>
          {repo.language && <Badge variant="outline">{repo.language}</Badge>}
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500" />
            <span>{repo.starCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            <span>Forks</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-orange-500" />
            <span>Issues</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant={starred ? "default" : "outline"}
            className="flex-1 h-7 text-xs gap-1"
            onClick={handleToggleStar}
            disabled={isLoading}
          >
            <Star
              className="h-3 w-3"
              fill={starred ? "currentColor" : "none"}
            />
            {starred ? "Starred" : "Star"}
          </Button>
          <Button
            size="sm"
            variant={watching ? "default" : "outline"}
            className="flex-1 h-7 text-xs gap-1"
            onClick={handleToggleWatch}
            disabled={isLoading}
          >
            <Eye className="h-3 w-3" />
            {watching ? "Watch" : "Watch"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (disableNavigation) {
    return card;
  }

  return (
    <Link href={`/favorites/repo/${repo.owner}/${repo.repo}`}>{card}</Link>
  );
}
