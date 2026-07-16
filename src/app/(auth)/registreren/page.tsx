import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Account aanmaken — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function RegistrerenPage({
  searchParams,
}: {
  searchParams: Promise<{ volgende?: string }>;
}) {
  const { volgende } = await searchParams;
  return <RegisterForm next={volgende} />;
}
