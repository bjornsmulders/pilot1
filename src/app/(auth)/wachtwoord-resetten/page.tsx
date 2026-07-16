import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Wachtwoord resetten — JourneyOS" };
export const dynamic = "force-dynamic";

export default function WachtwoordResettenPage() {
  return <ResetPasswordForm />;
}
