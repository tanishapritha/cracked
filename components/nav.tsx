"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/problems", label: "Problems" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b-2 border-[#1a1a1a] bg-[#000000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-lg font-bold tracking-tight transition-colors group"
            >
              <span className="text-[#f5f5f5]">cracked</span>
              <span className="text-[#84cc16]">dev</span>
            </Link>
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-1.5 text-sm transition-colors relative",
                      isActive
                        ? "text-[#f5f5f5]"
                        : "text-[#737373] hover:text-[#f5f5f5]"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#84cc16]" />
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#737373]">(Auth Disabled)</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
