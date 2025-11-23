"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Settings, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface UserProfileMenuProps {
  username?: string;
  orgName?: string;
  isCollapsed?: boolean;
  onLogout: () => Promise<void>;
}

export function UserProfileMenu({
  username,
  orgName,
  isCollapsed = false,
  onLogout,
}: UserProfileMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch (error) {
      console.error("Logout error:", error);
      window.location.replace("/");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  const avatarContent = (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
      {username?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
    </div>
  );

  if (isCollapsed) {
    return (
      <div className="p-3 border-t border-slate-700 dark:border-slate-800 flex-shrink-0">
        <DropdownMenu>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-900 transition-colors"
                    aria-label="User menu"
                  >
                    {avatarContent}
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{username}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{username}</p>
              <p className="text-xs text-muted-foreground">
                {orgName || "GitHub User"}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Çıkış yapmak istediğinize emin misiniz?</DialogTitle>
              <DialogDescription>
                Oturumunuz sonlandırılacak ve giriş sayfasına yönlendirileceksiniz.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowLogoutDialog(false)}
                disabled={isLoggingOut}
              >
                İptal
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogoutConfirm}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Çıkış yapılıyor...
                  </>
                ) : (
                  "Çıkış Yap"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-slate-700 dark:border-slate-800 flex-shrink-0">
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800 dark:bg-slate-900 mb-3">
        {avatarContent}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate text-slate-100">{username}</div>
          <div className="text-xs text-slate-400 truncate">
            {orgName || "GitHub User"}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Profile"
              >
                <User className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Profile</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                asChild
              >
                <Link href="/settings" aria-label="Settings">
                  <Settings className="w-4 h-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ThemeToggle />

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                aria-label="Logout"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Çıkış yapmak istediğinize emin misiniz?</DialogTitle>
            <DialogDescription>
              Oturumunuz sonlandırılacak ve giriş sayfasına yönlendirileceksiniz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              disabled={isLoggingOut}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Çıkış yapılıyor...
                </>
              ) : (
                "Çıkış Yap"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
