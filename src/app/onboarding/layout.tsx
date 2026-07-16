import { redirect } from "next/navigation";

import { requireUser, getActiveMembership } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const membership = await getActiveMembership();

  if (membership) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <span className="mb-8 text-xl font-semibold text-primary">JourneyOS</span>
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
