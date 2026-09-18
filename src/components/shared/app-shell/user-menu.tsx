"use client";

import { signOutWithPushCleanup } from "@/lib/sign-out";
import Link from "next/link";
import { LogOut, Settings, ShieldCheck, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { themeOptions } from "@/components/shared/theme-toggle";
import { useRolePreview } from "@/components/shared/role-preview";
import { useCurrentUser } from "@/hooks/use-current-user";

export function UserAvatar({ className }: { className?: string }) {
  const { initials } = useCurrentUser();

  return (
    <Avatar className={cn("size-11 after:border-transparent", className)}>
      <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">{initials}</AvatarFallback>
    </Avatar>
  );
}

export function UserMenu() {
  const { theme, setTheme } = useTheme();
  const { ownRoleCode, previewRoleCode, roles, setPreviewRoleCode } = useRolePreview();
  const effectiveCode = previewRoleCode ?? ownRoleCode;
  const currentUser = useCurrentUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Open account menu"
            className="rounded-full outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95"
          >
            <UserAvatar />
          </button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={10} className="w-60 rounded-2xl p-1.5 shadow-float">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 py-2">
            <span className="block text-sm font-semibold text-foreground">{currentUser.name}</span>
            <span className="block text-xs font-normal text-muted-foreground">{currentUser.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="h-10 rounded-xl px-2.5" render={<Link href="/settings" />}>
            <UserRound /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="h-10 rounded-xl px-2.5" render={<Link href="/team" />}>
            <ShieldCheck /> Admin
          </DropdownMenuItem>
          <DropdownMenuItem className="h-10 rounded-xl px-2.5" render={<Link href="/settings" />}>
            <Settings /> Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <DropdownMenuRadioItem key={value} value={value} className="h-10 rounded-xl px-2.5">
                <Icon /> {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Preview as</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={effectiveCode} onValueChange={(code) => setPreviewRoleCode(code === ownRoleCode ? null : code)}>
            {roles.map((role) => (
              <DropdownMenuRadioItem key={role.code} value={role.code} className="h-10 rounded-xl px-2.5">
                {role.name}
                {role.code === ownRoleCode ? <span className="ml-auto text-[10px] text-muted-foreground">You</span> : null}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="h-10 rounded-xl px-2.5" onClick={() => signOutWithPushCleanup({ callbackUrl: "/login" })}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
