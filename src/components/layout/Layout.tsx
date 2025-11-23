"use client";

import { Suspense, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { useSidebarState, usePreferencesStore, useStoreHydration } from "@/stores";
import { SidebarToggle } from "./SidebarToggle";

export function Layout({ children }: { children: React.ReactNode }) {
  const { setOpen } = useSidebarState();
  const hasHydrated = useStoreHydration();
  const { sidebarCollapsed } = usePreferencesStore();
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getMarginLeft = () => {
    if (!isLargeScreen) return "0px";
    if (!hasHydrated) return "256px";
    return sidebarCollapsed ? "70px" : "256px";
  };

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="absolute left-0 top-0 h-full z-10">
        <Suspense
          fallback={
            <div className="w-64 h-full bg-gray-100 dark:bg-gray-900 animate-pulse" />
          }
        >
          <Sidebar />
        </Suspense>
        <SidebarToggle onClick={() => setOpen(true)} />
      </div>

      <main
        className="h-full overflow-auto transition-all duration-300 ease-in-out"
        style={{
          marginLeft: getMarginLeft()
        }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
