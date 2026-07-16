import Link from "next/link";
import { LayoutDashboard, Settings, Tent, ListChecks, Users, Shuffle } from "lucide-react";

import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { OrganizationRole } from "@/lib/supabase/database.types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/retreats", label: "Retreats", icon: Tent },
  { href: "/leads", label: "Leads", icon: ListChecks },
  { href: "/deelnemers", label: "Deelnemers", icon: Users },
  { href: "/instellingen/organisatie", label: "Instellingen", icon: Settings },
];

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function AppSidebar({
  organizationName,
  userFullName,
  role,
  isPlatformAdmin = false,
}: {
  organizationName: string;
  userFullName: string;
  role: OrganizationRole;
  isPlatformAdmin?: boolean;
}) {
  const navItems = isPlatformAdmin
    ? [
        ...NAV_ITEMS,
        { href: "/platform", label: "Platform", icon: Shuffle },
      ]
    : NAV_ITEMS;

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <p className="text-sm font-medium text-muted-foreground">JourneyOS</p>
        <p className="truncate text-lg font-semibold text-foreground">{organizationName}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => (
          <Button key={item.href} asChild variant="ghost" className="justify-start gap-2">
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="flex items-center gap-3 border-t border-border p-4">
        <Avatar>
          <AvatarFallback>{initials(userFullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{userFullName}</p>
          <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            Uitloggen
          </Button>
        </form>
      </div>
    </aside>
  );
}
