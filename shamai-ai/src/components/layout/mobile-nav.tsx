"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Store, LayoutDashboard, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/estimate", label: "שמאי", icon: Camera },
  { href: "/marketplace", label: "שוק", icon: Store },
  { href: "/dashboard", label: "לוח שלי", icon: LayoutDashboard },
  { href: "/dashboard/settings", label: "חשבון", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
