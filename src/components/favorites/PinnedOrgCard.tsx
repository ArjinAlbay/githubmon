"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, X } from "lucide-react";
import type { PinnedOrg } from "@/stores/pinnedTemplates";

interface PinnedOrgCardProps {
  org: PinnedOrg;
  onRemove?: (orgId: string) => void;
  onSelect?: () => void;
  disableNavigation?: boolean;
}

export function PinnedOrgCard({ org, onRemove, onSelect, disableNavigation }: PinnedOrgCardProps) {
  const card = (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer h-full"
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3 justify-between">
          <Avatar className="h-10 w-10">
            <AvatarImage src={org.avatarUrl} alt={org.name} />
            <AvatarFallback>{org.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(org.id);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardTitle className="text-sm">{org.name}</CardTitle>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {org.description || "No description available"}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            {org.followers} followers
          </span>
        </div>

        {disableNavigation ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-xs"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.();
            }}
          >
            Open in action feed
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-xs"
            asChild
          >
            <Link href={`/favorites/org/${org.name}`}>
              View Organization
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (disableNavigation) {
    return card;
  }

  return <Link href={`/favorites/org/${org.name}`}>{card}</Link>;
}
