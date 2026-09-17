export type ProjectStatus = "Active" | "Planning" | "Archived";
export type ProjectHealth = "On track" | "At risk" | "Behind";

export type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  health: ProjectHealth;
  owner: string;
  campaigns: number;
  leads: number;
  members: number;
  target: number;
  actual: number;
  startDate: string;
};

export const projects: Project[] = [
  { id: "PRJ-001", name: "Clinic Growth", description: "Facebook and Instagram lead generation for independent clinics in Addis Ababa.", status: "Active", health: "On track", owner: "Amanuel M.", campaigns: 3, leads: 178, members: 3, target: 60000, actual: 42800, startDate: "Jun 1, 2026" },
  { id: "PRJ-002", name: "Partner Growth", description: "Referral partner program with regional medical distributors.", status: "Active", health: "At risk", owner: "Yared K.", campaigns: 1, leads: 46, members: 2, target: 20000, actual: 9400, startDate: "Jul 15, 2026" },
  { id: "PRJ-003", name: "Q1 Dental Push", description: "Seasonal push targeting dental practices ahead of Q1 renewals.", status: "Planning", health: "On track", owner: "Amanuel M.", campaigns: 0, leads: 0, members: 1, target: 15000, actual: 0, startDate: "Jan 5, 2027" },
  { id: "PRJ-004", name: "2025 Pilot Cohort", description: "The original pilot campaign used to validate the WhatsApp-to-call workflow.", status: "Archived", health: "On track", owner: "Amanuel M.", campaigns: 2, leads: 94, members: 1, target: 12000, actual: 13650, startDate: "Feb 1, 2025" },
];

export const projectStatuses: ProjectStatus[] = ["Active", "Planning", "Archived"];
