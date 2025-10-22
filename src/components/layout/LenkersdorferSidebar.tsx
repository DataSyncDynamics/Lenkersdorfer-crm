"use client";

import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useNotifications } from "@/contexts/NotificationContext";
import { useMessaging } from "@/contexts/MessagingContext";
import { useTheme } from "@/components/ui/theme-provider";
import { useAuth } from "@/components/auth/AuthProvider";
import { LenkersdorferLogo } from "@/components/ui/lenkersdorfer-logo";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { createMainNavigationLinks, createBottomNavigationItems } from "@/lib/navigation-utils";
import { getNavigationLinkClasses } from "@/lib/ui-utils";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface LenkersdorferSidebarProps {
  children: React.ReactNode
  onNotificationsClick?: () => void
}

export function LenkersdorferSidebar({ children, onNotificationsClick }: LenkersdorferSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { getCounts } = useNotifications();
  const { getTotalUnreadCount } = useMessaging();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const counts = getCounts();
  const messagingUnreadCount = getTotalUnreadCount();
  const [open, setOpen] = useState(false);

  const mainLinks = createMainNavigationLinks(pathname, counts, messagingUnreadCount);
  const bottomItems = createBottomNavigationItems(pathname, counts);

  // Handle sign out
  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background w-full">
      {/* Desktop Sidebar - Hidden on mobile */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-3 overflow-visible">
          <div className="flex flex-col overflow-y-auto overflow-x-visible">
            <LenkersdorferLogo collapsed={!open} />
            <div className="mt-3 flex flex-col gap-1.5">
              {mainLinks.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  className={getNavigationLinkClasses(pathname === link.href)}
                />
              ))}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col gap-1.5">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "flex items-center justify-start gap-2 py-1.5 rounded-lg text-foreground hover:text-gold-500 transition-all duration-200 group relative",
                getNavigationLinkClasses(false)
              )}
              style={{ overflow: 'visible' }}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <div className="relative overflow-visible flex-shrink-0 flex items-center justify-center w-5 h-5">
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </div>
              <span className="text-sm font-medium whitespace-pre">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            </button>

            {bottomItems.map((item, idx) => {
              // Handle sign out link specially
              if (item.href === '#sign-out') {
                return (
                  <button
                    key={idx}
                    onClick={handleSignOut}
                    className={cn(
                      "flex items-center justify-start gap-2 py-1.5 rounded-lg text-foreground hover:text-red-500 transition-all duration-200 group relative",
                      getNavigationLinkClasses(false)
                    )}
                    style={{ overflow: 'visible' }}
                  >
                    <div className="relative overflow-visible flex-shrink-0 flex items-center justify-center w-5 h-5">
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium whitespace-pre">
                      {item.label}
                    </span>
                  </button>
                )
              }

              return (
                <SidebarLink
                  key={idx}
                  link={item}
                  className={getNavigationLinkClasses(pathname === item.href)}
                />
              )
            })}
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content with bottom padding on mobile for bottom nav */}
      <div className="flex flex-1 pb-16 md:pb-0 md:ml-[300px]">
        {children}
      </div>

      {/* Mobile Bottom Navigation - Only visible on mobile/tablet */}
      <BottomNavigation
        messageCount={messagingUnreadCount || 0}
        alertCount={counts.total || 0}
        onNotificationsClick={onNotificationsClick}
      />
    </div>
  );
}

