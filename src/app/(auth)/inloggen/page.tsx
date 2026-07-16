import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Inloggen — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function InloggenPage({
  searchParams,
}: {
  searchParams: Promise<{ volgende?: string }>;
}) {
  const { volgende } = await searchParams;
  return <LoginForm next={volgende} />;
}
