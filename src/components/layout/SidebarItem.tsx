"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarItemProps {
  icon: LucideIcon;
  text: string;
  href?: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
  badge?: ReactNode;
  chevron?: ReactNode;
  className?: string;
}

export function SidebarItem({
  icon: Icon,
  text,
  href,
  isActive = false,
  isCollapsed = false,
  onClick,
  badge,
  chevron,
  className = "",
}: SidebarItemProps) {
  const baseClasses = `
    flex items-center gap-3 px-3 py-2 rounded-lg
    text-sm font-medium
    transition-all duration-200
    ${
      isActive
        ? "bg-slate-700 text-slate-100"
        : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
    }
    ${isCollapsed ? "justify-center" : ""}
    ${className}
  `;

  const content = (
    <>
      <div className="flex-shrink-0 w-6 flex items-center justify-center">
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      {!isCollapsed && (
        <>
          <span className="flex-1">{text}</span>
          {badge && <div className="flex items-center gap-1">{badge}</div>}
          {chevron && chevron}
        </>
      )}
      {isCollapsed && <span className="sr-only">{text}</span>}
    </>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            {href ? (
              <Link href={href} className={baseClasses} aria-label={text}>
                {content}
              </Link>
            ) : (
              <button
                onClick={onClick}
                className={baseClasses}
                aria-label={text}
              >
                {content}
              </button>
            )}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      {content}
    </button>
  );
}
