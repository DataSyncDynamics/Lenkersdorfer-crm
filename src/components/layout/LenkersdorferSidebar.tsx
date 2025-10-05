"use client";

import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useNotifications } from "@/contexts/NotificationContext";
import { useMessaging } from "@/contexts/MessagingContext";
import { useTheme } from "@/components/ui/theme-provider";
import { LenkersdorferLogo } from "@/components/ui/lenkersdorfer-logo";
import { createMainNavigationLinks, createBottomNavigationItems } from "@/lib/navigation-utils";
import { getNavigationLinkClasses } from "@/lib/ui-utils";
import { Moon, Sun } from "lucide-react";

export function LenkersdorferSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { getCounts } = useNotifications();
  const { getTotalUnreadCount } = useMessaging();
  const { theme, setTheme } = useTheme();
  const counts = getCounts();
  const messagingUnreadCount = getTotalUnreadCount();
  const [open, setOpen] = useState(false);

  const mainLinks = createMainNavigationLinks(pathname, counts, messagingUnreadCount);
  const bottomItems = createBottomNavigationItems(pathname, counts);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background w-full">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-4 overflow-visible">
          <div className="flex flex-col overflow-y-auto overflow-x-visible">
            <LenkersdorferLogo collapsed={!open} />
            <div className="mt-4 flex flex-col gap-2">
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
          <div className="flex flex-col gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center justify-start gap-2 py-2 rounded-lg text-foreground hover:text-gold-500 hover:bg-muted transition-all duration-200 group border border-border hover:border-gold-400"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <div className="relative overflow-visible flex-shrink-0">
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </div>
              {open && (
                <span className="text-sm font-medium">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
              )}
            </button>

            {bottomItems.map((item, idx) => (
              <SidebarLink
                key={idx}
                link={item}
                className={getNavigationLinkClasses(pathname === item.href)}
              />
            ))}
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex flex-1">
        {children}
      </div>
    </div>
  );
}

