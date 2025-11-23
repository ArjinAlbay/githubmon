"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface SubMenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string | number;
  isActive?: boolean;
}

interface SubMenuFlyoutProps {
  icon: LucideIcon;
  label: string;
  items: SubMenuItem[];
  totalBadge?: string | number;
  isActive?: boolean;
}

export function SubMenuFlyout({
  icon: Icon,
  label,
  items,
  totalBadge,
  isActive = false,
}: SubMenuFlyoutProps) {
  return (
    <HoverCard openDelay={0} closeDelay={50}>
      <HoverCardTrigger asChild>
        <div
          className={`
            flex items-center gap-3 px-3 py-2 rounded-lg
            text-sm font-medium cursor-pointer
            transition-all duration-200
            justify-center
            ${
              isActive
                ? "bg-slate-700 text-slate-100"
                : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            }
          `}
        >
          <div className="shrink-0 w-5 h-5 flex items-center justify-center">
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        className="p-1 min-w-[200px] bg-slate-800 border-slate-700"
      >
        <div className="bg-slate-800 rounded-lg shadow-lg py-2 px-1">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{label}</span>
            {totalBadge !== undefined && (
              <Badge
                variant="outline"
                className="text-xs min-w-[1.25rem] h-5 bg-muted/30 border-muted-foreground/20"
              >
                {totalBadge}
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors font-medium
                  ${
                    item.isActive
                      ? "bg-slate-700 text-slate-100"
                      : "text-slate-300 hover:text-slate-100 hover:bg-slate-900"
                  }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && (
                  <Badge
                    variant="outline"
                    className="ml-auto text-xs bg-muted/30 border-muted-foreground/20"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
