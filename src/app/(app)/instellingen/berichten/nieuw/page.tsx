import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getActiveMembership } from "@/lib/auth/session";
import { createMessageTemplateAction } from "@/actions/messages";
import { MessageTemplateForm } from "@/components/messages/message-template-form";

export const metadata: Metadata = { title: "Nieuwe template — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function NieuweTemplatePage() {
  const membership = await getActiveMembership();
  if (!membership) return null;

  if (membership.role !== "owner" && membership.role !== "admin") {
    redirect("/dashboard");
  }

  const boundAction = createMessageTemplateAction.bind(null, membership.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Nieuwe template</h1>
      </div>
      <MessageTemplateForm action={boundAction} submitLabel="Template aanmaken" />
    </div>
  );
}
