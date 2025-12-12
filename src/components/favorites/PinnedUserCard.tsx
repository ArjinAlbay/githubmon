"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, X } from "lucide-react";
import { githubWriteClient } from "@/lib/api/github-write-client";
import { usePinnedTemplatesStore, type PinnedUser } from "@/stores/pinnedTemplates";
import { useAuthStore } from "@/stores/auth";

interface PinnedUserCardProps {
  user: PinnedUser;
  onRemove?: (userId: string) => void;
  onSelect?: () => void;
  disableNavigation?: boolean;
}

export function PinnedUserCard({ user, onRemove, onSelect, disableNavigation }: PinnedUserCardProps) {
  const [following, setFollowing] = useState(user.following);
  const [isLoading, setIsLoading] = useState(false);
  const { updatePinnedUser } = usePinnedTemplatesStore();
  const orgData = useAuthStore((state) => state.orgData);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!orgData?.token || isLoading) return;
    setIsLoading(true);

    try {
      githubWriteClient.setUserToken(orgData.token);

      if (following) {
        const result = await githubWriteClient.unfollowUser(user.username);
        if (result.success) {
          setFollowing(false);
          updatePinnedUser(user.id, { following: false });
        }
      } else {
        const result = await githubWriteClient.followUser(user.username);
        if (result.success) {
          setFollowing(true);
          updatePinnedUser(user.id, { following: true });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const card = (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer h-full"
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3 justify-between">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatarUrl} alt={user.username} />
            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(user.id);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardTitle className="text-sm">{user.username}</CardTitle>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {user.bio || "No bio available"}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          <div>
            <div className="font-semibold">{user.followers}</div>
            <div className="text-muted-foreground">Followers</div>
          </div>
          <div>
            <div className="font-semibold">{user.publicRepos}</div>
            <div className="text-muted-foreground">Repos</div>
          </div>
          <div>
            <div className="font-semibold">0</div>
            <div className="text-muted-foreground">Stars</div>
          </div>
        </div>

        <Button
          size="sm"
          variant={following ? "default" : "outline"}
          className="w-full h-7 text-xs gap-1"
          onClick={handleToggleFollow}
          disabled={isLoading}
        >
          <Users className="h-3 w-3" />
          {following ? "Following" : "Follow"}
        </Button>
      </CardContent>
    </Card>
  );

  if (disableNavigation) {
    return card;
  }

  return <Link href={`/favorites/user/${user.username}`}>{card}</Link>;
}
