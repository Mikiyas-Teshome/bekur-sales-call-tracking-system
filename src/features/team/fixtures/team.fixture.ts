export type TeamMember = {
  id: string;
  initials: string;
  name: string;
  email: string;
  role: string;
  roleCode: string;
  status: "Active" | "Invited" | "Inactive";
  projects: number;
  leads: number;
  calls: number;
  conversion: string;
  revenue: string;
  lastActive: string;
};

export const teamMembers: TeamMember[] = [
  { id: "USR-001", initials: "AM", name: "Amanuel Mekonnen", email: "amanuel@bekur.app", role: "Administrator", roleCode: "administrator", status: "Active", projects: 3, leads: 248, calls: 118, conversion: "22.5%", revenue: "$16,740", lastActive: "Active now" },
  { id: "USR-002", initials: "SA", name: "Saron Abebe", email: "saron@bekur.app", role: "Sales Rep", roleCode: "sales-rep", status: "Active", projects: 2, leads: 91, calls: 104, conversion: "19.0%", revenue: "$13,950", lastActive: "8 min ago" },
  { id: "USR-003", initials: "YK", name: "Yared Kebede", email: "yared@bekur.app", role: "Sales Manager", roleCode: "sales-manager", status: "Active", projects: 2, leads: 122, calls: 92, conversion: "15.2%", revenue: "$8,370", lastActive: "42 min ago" },
  { id: "USR-004", initials: "MH", name: "Marta Haile", email: "marta@bekur.app", role: "Sales Rep", roleCode: "sales-rep", status: "Active", projects: 1, leads: 64, calls: 72, conversion: "11.4%", revenue: "$3,740", lastActive: "2 hr ago" },
  { id: "USR-005", initials: "DB", name: "Daniel Bekele", email: "daniel@bekur.app", role: "Sales Rep", roleCode: "sales-rep", status: "Invited", projects: 0, leads: 0, calls: 0, conversion: "-", revenue: "$0", lastActive: "Invite sent yesterday" },
];

