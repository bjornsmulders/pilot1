import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getActiveMembership } from "@/lib/auth/session";
import { getMessageTemplate } from "@/lib/data/messages";
import { updateMessageTemplateAction } from "@/actions/messages";
import { MessageTemplateForm } from "@/components/messages/message-template-form";

export const metadata: Metadata = { title: "Template bewerken — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const membership = await getActiveMembership();
  if (!membership) return null;

  if (membership.role !== "owner" && membership.role !== "admin") {
    redirect("/dashboard");
  }

  const template = await getMessageTemplate(membership.organizationId, templateId);
  if (!template) notFound();

  const boundAction = updateMessageTemplateAction.bind(
    null,
    membership.organizationId,
    templateId
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Template bewerken</h1>
      </div>
      <MessageTemplateForm action={boundAction} template={template} submitLabel="Wijzigingen opslaan" />
    </div>
  );
}
