"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  useSidebarState,
  useAuthStore,
  useStoreHydration,
  useActionItemsStore,
  usePreferencesStore,
} from "@/stores";
import { useQuickWinsStore } from "@/stores/quickWins";
import {
  ChevronRight,
  Clock,
  MessageSquare,
  Star,
  Target,
  Zap,
  Home,
  UserCheck,
  Lightbulb,
  Wrench,
  PanelLeftClose,
  PanelLeftOpen,
  GitBranch,
  Pin,
} from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AnimatedLogo } from "./AnimatedLogo";
import { SidebarItem } from "./SidebarItem";
import { SidebarGroup } from "./SidebarGroup";
import { UserProfileMenu } from "./UserProfileMenu";
import { SubMenuFlyout } from "./SubMenuFlyout";

export function Sidebar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isOpen, setOpen } = useSidebarState();

  const hasHydrated = useStoreHydration();
  const { sidebarCollapsed, setSidebarCollapsed } = usePreferencesStore();

  const { isConnected, logout, orgData } = useAuthStore();

  const { getCountByType, loading } = useActionItemsStore();
  const { pinnedRepos } = usePreferencesStore();

  const {
    goodIssues,
    easyFixes,
    loading: quickWinsLoading,
  } = useQuickWinsStore();

  const [actionRequiredOpen, setActionRequiredOpen] = useState(false);
  const [quickWinsOpen, setQuickWinsOpen] = useState(false);

  useEffect(() => {
    const isActionRequiredPage = pathname === "/action-required";
    const isQuickWinsPage = pathname === "/quick-wins";

    if (isActionRequiredPage) {
      setActionRequiredOpen(true);
    }
    if (isQuickWinsPage) {
      setQuickWinsOpen(true);
    }

    if (
      pathname === "/dashboard" ||
      pathname === "/settings" ||
      pathname === "/favorites" ||
      pathname === "/search"
    ) {
      setActionRequiredOpen(false);
      setQuickWinsOpen(false);
    }
  }, [pathname]);

  const handleActionRequiredToggle = (open: boolean) => {
    if (!open && pathname === "/action-required") {
      return;
    }
    setActionRequiredOpen(open);
  };

  const handleQuickWinsToggle = (open: boolean) => {
    if (!open && pathname === "/quick-wins") {
      return;
    }
    setQuickWinsOpen(open);
  };

  const currentTab = searchParams?.get("tab") || "assigned";

  const getBadgeCount = useMemo(() => {
    return (
      type: "assigned" | "mentions" | "stale" | "goodFirstIssues" | "easyFixes"
    ) => {
      if (!hasHydrated) return 0;

      if (type === "goodFirstIssues") return goodIssues.length;
      if (type === "easyFixes") return easyFixes.length;
      return getCountByType(type);
    };
  }, [hasHydrated, goodIssues.length, easyFixes.length, getCountByType]);

  const getActionRequiredTotal = useMemo(() => {
    if (!hasHydrated) return 0;
    return (
      getBadgeCount("assigned") +
      getBadgeCount("mentions") +
      getBadgeCount("stale")
    );
  }, [hasHydrated, getBadgeCount]);

  const getQuickWinsTotal = useMemo(() => {
    if (!hasHydrated) return 0;
    return getBadgeCount("goodFirstIssues") + getBadgeCount("easyFixes");
  }, [hasHydrated, getBadgeCount]);

  const getBadgeContent = (
    type: "assigned" | "mentions" | "stale" | "goodFirstIssues" | "easyFixes"
  ) => {
    if (!hasHydrated) return 0;

    if (type === "goodFirstIssues" || type === "easyFixes") {
      if (quickWinsLoading.goodIssues || quickWinsLoading.easyFixes)
        return "...";
    } else {
      if (loading[type]) return "...";
    }
    return getBadgeCount(type) || 0;
  };

  const isQuickWinsTab = pathname === "/quick-wins";
  const isActionRequiredTab = pathname === "/action-required";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
        fixed top-0 left-0 bg-slate-900 border-r border-slate-700 z-50 transform transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? "lg:w-[70px] w-64" : "w-64"}
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        flex flex-col
        h-screen
      `}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700 shrink-0">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <AnimatedLogo size={32} />
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    GitHubMon
                  </h2>
                  <p className="text-xs text-slate-400">OSS Analytics</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden lg:flex h-8 w-8 p-0"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
                <button
                  onClick={() => setOpen(false)}
                  className="lg:hidden text-slate-400 hover:text-slate-100 transition-colors h-8 w-8 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {hasHydrated && orgData?.username
                  ? orgData.username.charAt(0).toUpperCase()
                  : "G"}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(false)}
                className="h-8 w-8 p-0"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <nav className="space-y-1">
              <SidebarGroup
                title="ANALYTICS"
                isCollapsed={sidebarCollapsed}
                className="mt-2"
              />

              <SidebarItem
                icon={Home}
                text="Dashboard"
                href="/dashboard"
                isActive={pathname === "/dashboard"}
                isCollapsed={sidebarCollapsed}
              />

              <div>
                {sidebarCollapsed ? (
                  <SubMenuFlyout
                    icon={Zap}
                    label="Action Required"
                    totalBadge={getActionRequiredTotal}
                    isActive={isActionRequiredTab}
                    items={[
                      {
                        icon: UserCheck,
                        label: "Assigned",
                        href: "/action-required?tab=assigned",
                        badge: getBadgeContent("assigned"),
                        isActive: pathname === "/action-required" && currentTab === "assigned",
                      },
                      {
                        icon: MessageSquare,
                        label: "Mentions",
                        href: "/action-required?tab=mentions",
                        badge: getBadgeContent("mentions"),
                        isActive: pathname === "/action-required" && currentTab === "mentions",
                      },
                      {
                        icon: Clock,
                        label: "Stale PRs",
                        href: "/action-required?tab=stale",
                        badge: getBadgeContent("stale"),
                        isActive: pathname === "/action-required" && currentTab === "stale",
                      },
                    ]}
                  />
                ) : (
                  <>
                    <SidebarItem
                      icon={Zap}
                      text="Action Required"
                      isActive={isActionRequiredTab}
                      isCollapsed={false}
                      onClick={() =>
                        handleActionRequiredToggle(!actionRequiredOpen)
                      }
                      badge={
                        <Badge
                          variant="outline"
                          className="text-xs min-w-[1.25rem] h-5 bg-muted/30 border-muted-foreground/20"
                        >
                          {getActionRequiredTotal}
                        </Badge>
                      }
                      chevron={
                        <ChevronRight
                          className={`w-4 h-4 transition-transform duration-200 ${
                            actionRequiredOpen ? "rotate-90" : ""
                          }`}
                        />
                      }
                    />

                    {actionRequiredOpen && (
                      <div className="ml-4 pl-4 space-y-1 mt-1 border-l-2 border-muted">
                        <Link
                          href="/action-required?tab=assigned"
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors font-medium
                            ${
                              pathname === "/action-required" &&
                              currentTab === "assigned"
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            }`}
                        >
                          <UserCheck className="w-4 h-4 shrink-0" />
                          <span className="flex-1">Assigned</span>
                          <Badge
                            variant="outline"
                            className="ml-auto text-xs bg-muted/30 border-muted-foreground/20"
                          >
                            {getBadgeContent("assigned")}
                          </Badge>
                        </Link>
                        <Link
                          href="/action-required?tab=mentions"
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors font-medium
                            ${
                              pathname === "/action-required" &&
                              currentTab === "mentions"
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            }`}
                        >
                          <MessageSquare className="w-4 h-4 shrink-0" />
                          <span className="flex-1">Mentions</span>
                          <Badge
                            variant="outline"
                            className="ml-auto text-xs bg-muted/30 border-muted-foreground/20"
                          >
                            {getBadgeContent("mentions")}
                          </Badge>
                        </Link>
                        <Link
                          href="/action-required?tab=stale"
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors font-medium
                            ${
                              pathname === "/action-required" &&
                              currentTab === "stale"
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            }`}
                        >
                          <Clock className="w-4 h-4 shrink-0" />
                          <span className="flex-1">Stale PRs</span>
                          <Badge
                            variant="outline"
                            className="ml-auto text-xs bg-muted/30 border-muted-foreground/20"
                          >
                            {getBadgeContent("stale")}
                          </Badge>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                {sidebarCollapsed ? (
                  <SubMenuFlyout
                    icon={Target}
                    label="Quick Wins"
                    totalBadge={getQuickWinsTotal}
                    isActive={isQuickWinsTab}
                    items={[
                      {
                        icon: Lightbulb,
                        label: "Good First Issues",
                        href: "/quick-wins?tab=good-issues",
                        badge: getBadgeContent("goodFirstIssues"),
                        isActive: pathname === "/quick-wins" && currentTab === "good-issues",
                      },
                      {
                        icon: Wrench,
                        label: "Easy Fixes",
                        href: "/quick-wins?tab=easy-fixes",
                        badge: getBadgeContent("easyFixes"),
                        isActive: pathname === "/quick-wins" && currentTab === "easy-fixes",
                      },
                    ]}
                  />
                ) : (
                  <>
                    <SidebarItem
                      icon={Target}
                      text="Quick Wins"
                      isActive={isQuickWinsTab}
                      isCollapsed={false}
                      onClick={() => handleQuickWinsToggle(!quickWinsOpen)}
                      badge={
                        <Badge
                          variant="outline"
                          className="text-xs min-w-[1.25rem] h-5 bg-muted/30 border-muted-foreground/20"
                        >
                          {getQuickWinsTotal}
                        </Badge>
                      }
                      chevron={
                        <ChevronRight
                          className={`w-4 h-4 transition-transform duration-200 ${
                            quickWinsOpen ? "rotate-90" : ""
                          }`}
                        />
                      }
                    />

                    {quickWinsOpen && (
                      <div className="ml-4 pl-4 space-y-1 mt-1 border-l-2 border-muted">
                        <Link
                          href="/quick-wins?tab=good-issues"
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors font-medium
                            ${
                              pathname === "/quick-wins" &&
                              currentTab === "good-issues"
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            }`}
                        >
                          <Lightbulb className="w-4 h-4 shrink-0" />
                          <span className="flex-1">Good First Issues</span>
                          <Badge
                            variant="outline"
                            className="ml-auto text-xs bg-muted/30 border-muted-foreground/20"
                          >
                            {getBadgeContent("goodFirstIssues")}
                          </Badge>
                        </Link>
                        <Link
                          href="/quick-wins?tab=easy-fixes"
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors font-medium
                            ${
                              pathname === "/quick-wins" &&
                              currentTab === "easy-fixes"
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            }`}
                        >
                          <Wrench className="w-4 h-4 shrink-0" />
                          <span className="flex-1">Easy Fixes</span>
                          <Badge
                            variant="outline"
                            className="ml-auto text-xs bg-muted/30 border-muted-foreground/20"
                          >
                            {getBadgeContent("easyFixes")}
                          </Badge>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>

              <SidebarItem
                icon={Star}
                text="Favorites"
                href="/favorites"
                isActive={pathname === "/favorites"}
                isCollapsed={sidebarCollapsed}
              />

              {hasHydrated && pinnedRepos.length > 0 && (
                <>
                  <SidebarGroup
                    icon={Pin}
                    title="Pinned Repos"
                    isCollapsed={sidebarCollapsed}
                    className="mt-6"
                  />
                  <div className="space-y-1">
                    {pinnedRepos.slice(0, 5).map((repo) => {
                      if (sidebarCollapsed) {
                        return (
                          <TooltipProvider key={repo} delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={`https://github.com/${repo}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors"
                                  aria-label={repo}
                                >
                                  <GitBranch className="w-4 h-4 shrink-0" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>{repo}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      }
                      return (
                        <a
                          key={repo}
                          href={`https://github.com/${repo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent/50 transition-colors font-medium text-muted-foreground hover:text-foreground"
                        >
                          <GitBranch className="w-4 h-4 shrink-0" />
                          <span className="truncate flex-1">{repo}</span>
                        </a>
                      );
                    })}
                  </div>
                </>
              )}
            </nav>
          </div>
        </div>

        {hasHydrated && isConnected && orgData && (
          <UserProfileMenu
            username={orgData.username}
            orgName={orgData.orgName}
            isCollapsed={sidebarCollapsed}
            onLogout={logout}
          />
        )}
      </aside>
    </>
  );
}
