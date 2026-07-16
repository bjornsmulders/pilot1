import { redirect } from "next/navigation";

import { requireUser, getActiveMembership, getCurrentProfile } from "@/lib/auth/session";
import { AppSidebar } from "@/components/layout/app-sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const [membership, profile] = await Promise.all([
    getActiveMembership(),
    getCurrentProfile(),
  ]);

  if (!membership) {
    redirect("/onboarding/organisatie-aanmaken");
  }

  return (
    <div className="flex min-h-screen flex-1">
      <AppSidebar
        organizationName={membership.organization.name}
        userFullName={profile?.full_name || "Onbekende gebruiker"}
        role={membership.role}
        isPlatformAdmin={profile?.is_platform_admin ?? false}
      />
      <main className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">{children}</main>
    </div>
  );
}
