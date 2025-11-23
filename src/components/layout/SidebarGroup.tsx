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
      className={`px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 ${className}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      <span>{title}</span>
    </div>
  );
}
