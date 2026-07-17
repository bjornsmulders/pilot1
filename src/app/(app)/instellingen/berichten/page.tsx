import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import { getActiveMembership } from "@/lib/auth/session";
import { listMessageTemplates } from "@/lib/data/messages";
import { deleteMessageTemplateAction } from "@/actions/messages";
import { MessageTemplateList } from "@/components/messages/message-template-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Berichttemplates — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function MessageTemplatesPage() {
  const membership = await getActiveMembership();
  if (!membership) return null;

  // Templates beheren is owner/admin-only (RLS message_templates_write staat
  // ook alleen owner/admin toe).
  if (membership.role !== "owner" && membership.role !== "admin") {
    redirect("/dashboard");
  }

  const templates = await listMessageTemplates(membership.organizationId);
  const boundDelete = deleteMessageTemplateAction.bind(null, membership.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Berichttemplates</h1>
          <p className="text-muted-foreground">
            Kant-en-klare WhatsApp-berichten voor leads en deelnemers.
          </p>
        </div>
        <Button asChild>
          <Link href="/instellingen/berichten/nieuw">Nieuwe template</Link>
        </Button>
      </div>

      <MessageTemplateList templates={templates} onDelete={boundDelete} />
    </div>
  );
}
