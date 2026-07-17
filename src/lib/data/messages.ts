import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth/session";
import type { MessageTemplateRow } from "@/lib/supabase/database.types";

export async function listMessageTemplates(organizationId: string): Promise<MessageTemplateRow[]> {
  await requireMembership(organizationId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getMessageTemplate(
  organizationId: string,
  templateId: string
): Promise<MessageTemplateRow | null> {
  await requireMembership(organizationId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", templateId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
