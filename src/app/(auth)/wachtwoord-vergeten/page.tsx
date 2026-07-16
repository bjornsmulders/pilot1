import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Wachtwoord vergeten — JourneyOS" };
export const dynamic = "force-dynamic";

export default function WachtwoordVergetenPage() {
  return <ForgotPasswordForm />;
}
