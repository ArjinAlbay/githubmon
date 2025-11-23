"use client";

import { LucideIcon } from "lucide-react";

interface SidebarGroupProps {
  icon?: LucideIcon;
  title: string;
  isCollapsed?: boolean;
  className?: string;
}

export function SidebarGroup({
  icon: Icon,
  title,
  isCollapsed = false,
  className = "",
}: SidebarGroupProps) {
  if (isCollapsed) {
    return null;
  }

  return (
    <div
      className={`px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-3 ${className}`}
    >
      <div className="flex-shrink-0 w-6 flex items-center justify-center">
        {Icon && <Icon className="w-4 h-4" />}
      </div>
      <span>{title}</span>
    </div>
  );
}
