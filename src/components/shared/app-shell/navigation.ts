import {
  BarChart3,
  BriefcaseBusiness,
  LayoutGrid,
  Megaphone,
  Settings,
  UsersRound,
  Contact,
  type LucideIcon,
} from "lucide-react";
import { hasPermission, type PermissionKey, type PermissionSet } from "@/lib/permissions";

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const primaryNavigation: NavigationItem[] = [
  { href: "/", label: "Home", icon: LayoutGrid },
  { href: "/leads", label: "Leads", icon: Contact },
  { href: "/projects", label: "Projects", icon: BriefcaseBusiness },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/team", label: "Team", icon: UsersRound },
];

export const settingsNavigation: NavigationItem = { href: "/settings", label: "Settings", icon: Settings };

export const mobileTabs: NavigationItem[] = primaryNavigation.filter(({ href }) =>
  ["/", "/leads", "/campaigns", "/reports"].includes(href),
);

const navigationGuards: Record<string, PermissionKey> = {
  "/team": "team:view",
  "/projects": "projects:view",
};

export function navigationFor(permissions: PermissionSet) {
  return primaryNavigation.filter((item) => {
    const guard = navigationGuards[item.href];
    return !guard || hasPermission(permissions, guard);
  });
}

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/leads": "Leads",
  "/projects": "Projects",
  "/campaigns": "Campaigns",
  "/reports": "Reports",
  "/team": "Team",
  "/settings": "Settings",
};

export function isCurrentPath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function pageTitleFor(pathname: string) {
  const match = Object.keys(pageTitles)
    .filter((href) => isCurrentPath(pathname, href))
    .sort((a, b) => b.length - a.length)[0];

  return match ? pageTitles[match] : "Bekur";
}
