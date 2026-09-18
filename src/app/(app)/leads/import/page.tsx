import { BulkImportLeads } from "@/features/clients/components/bulk-import-leads";
import { listAllPhoneNumbers } from "@/services/clients.service";
import { listCampaigns } from "@/services/campaigns.service";

export const dynamic = "force-dynamic";

export default async function ImportLeadsPage() {
  const [phones, campaigns] = await Promise.all([listAllPhoneNumbers(), listCampaigns()]);
  const importableCampaigns = campaigns.map((campaign) => ({ code: campaign.id, name: campaign.name, project: campaign.project }));
  const existingPhones = phones.map((phone) => phone.replaceAll(/\D/g, ""));

  return <BulkImportLeads campaigns={importableCampaigns} existingPhones={existingPhones} />;
}
