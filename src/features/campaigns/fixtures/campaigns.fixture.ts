export type CampaignPlatform = "Facebook" | "Instagram" | "Referral" | "Organic";
export type CampaignStatus = "Active" | "Paused" | "Ended";

export type Campaign = {
  id: string;
  name: string;
  project: string;
  platform: CampaignPlatform;
  status: CampaignStatus;
  owner: string;
  leads: number;
  calls: number;
  won: number;
  spend: number;
  revenue: number;
  startDate: string;
};

export const campaigns: Campaign[] = [
  { id: "CMP-014", name: "September Messages", project: "Clinic Growth", platform: "Instagram", status: "Active", owner: "Amanuel M.", leads: 48, calls: 112, won: 9, spend: 1240, revenue: 16400, startDate: "Sep 1, 2026" },
  { id: "CMP-013", name: "Clinic Owners · Addis", project: "Clinic Growth", platform: "Facebook", status: "Active", owner: "Saron A.", leads: 31, calls: 76, won: 6, spend: 980, revenue: 11200, startDate: "Aug 12, 2026" },
  { id: "CMP-012", name: "Demo Requests", project: "Clinic Growth", platform: "Facebook", status: "Active", owner: "Amanuel M.", leads: 27, calls: 64, won: 5, spend: 720, revenue: 9800, startDate: "Jul 28, 2026" },
  { id: "CMP-011", name: "Dental Practices", project: "Clinic Growth", platform: "Instagram", status: "Paused", owner: "Yared K.", leads: 19, calls: 41, won: 2, spend: 540, revenue: 3200, startDate: "Jun 15, 2026" },
  { id: "CMP-009", name: "Referral Partners", project: "Partner Growth", platform: "Referral", status: "Active", owner: "Yared K.", leads: 46, calls: 58, won: 4, spend: 0, revenue: 9400, startDate: "Jul 15, 2026" },
  { id: "CMP-004", name: "Organic Inbound", project: "2025 Pilot Cohort", platform: "Organic", status: "Ended", owner: "Amanuel M.", leads: 94, calls: 130, won: 11, spend: 0, revenue: 13650, startDate: "Feb 1, 2025" },
];

export const campaignPlatforms: CampaignPlatform[] = ["Facebook", "Instagram", "Referral", "Organic"];
export const campaignStatuses: CampaignStatus[] = ["Active", "Paused", "Ended"];
export const campaignProjects = [...new Set(campaigns.map((campaign) => campaign.project))];
