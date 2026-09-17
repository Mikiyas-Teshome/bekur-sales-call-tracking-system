import { BulkImportLeads } from "@/features/clients/components/bulk-import-leads";
import { listLeads } from "@/services/clients.service";
import { listCampaigns } from "@/services/campaigns.service";

export default async function ImportLeadsPage() {
  const [leads, campaigns] = await Promise.all([listLeads(), listCampaigns()]);
  const importableCampaigns = campaigns.map((campaign) => ({ code: campaign.id, name: campaign.name, project: campaign.project }));
  const existingPhones = leads.map((lead) => lead.phone.replaceAll(/\D/g, ""));

  return <BulkImportLeads campaigns={importableCampaigns} existingPhones={existingPhones} />;
}
