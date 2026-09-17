"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Phone, PhoneCall, UserRoundPlus } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { themeOptions } from "@/components/shared/theme-toggle";
import { useRolePreview } from "@/components/shared/role-preview";
import { leads } from "@/features/clients/fixtures/leads.fixture";
import { useLauncher } from "./launcher-context";
import { navigationFor, settingsNavigation } from "./navigation";

const itemClass = "h-11 gap-3 px-3 [&_svg:not([class*='size-'])]:size-[18px]";

export function CommandLauncher() {
  const { open, setOpen } = useLauncher();
  const router = useRouter();
  const { setTheme } = useTheme();
  const { effectivePermissions } = useRolePreview();

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Jump to a page, a lead, or an action."
      className="rounded-3xl! sm:max-w-xl"
    >
      <Command className="rounded-3xl">
        <CommandInput placeholder="Search leads, pages, or actions…" />
        <CommandList className="max-h-[60dvh] p-1.5">
          <CommandEmpty>Nothing matches that yet.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem
              className={itemClass}
              onSelect={() => run(() => undefined)}
            >
              <PhoneCall /> Log a call
            </CommandItem>
            <CommandItem
              className={itemClass}
              onSelect={() => run(() => router.push("/leads"))}
            >
              <UserRoundPlus /> Add a lead
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Leads">
            {leads.map((lead) => (
              <CommandItem
                key={lead.phone}
                value={`${lead.name} ${lead.business} ${lead.phone}`}
                className={itemClass}
                onSelect={() =>
                  run(() =>
                    window.open(
                      `tel:${lead.phone.replace(/\s+/g, "")}`,
                      "_self",
                    ),
                  )
                }
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold text-primary">
                  {lead.initials}
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate font-semibold">
                    {lead.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {lead.business} · {lead.phone}
                  </span>
                </span>
                <Phone className="text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Pages">
            {[...navigationFor(effectivePermissions), settingsNavigation].map(
              ({ href, label, icon: Icon }) => (
                <CommandItem
                  key={href}
                  value={`page ${label}`}
                  className={itemClass}
                  onSelect={() => run(() => router.push(href))}
                >
                  <Icon /> {label}
                </CommandItem>
              ),
            )}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Theme">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <CommandItem
                key={value}
                value={`theme ${label}`}
                className={itemClass}
                onSelect={() => run(() => setTheme(value))}
              >
                <Icon /> {label} theme
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
