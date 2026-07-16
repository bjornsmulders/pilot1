import type { Metadata } from "next";

import { CreateOrganizationForm } from "@/components/organizations/create-organization-form";

export const metadata: Metadata = { title: "Organisatie aanmaken — JourneyOS" };

export default function OrganisatieAanmakenPage() {
  return <CreateOrganizationForm />;
}
