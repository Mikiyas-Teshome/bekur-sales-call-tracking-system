"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { markUserNotificationReadAction, listUserNotificationsAction } from "@/actions/notifications";

export type AppNotification = {
  id: number;
  category: string;
  title: string;
  body: string;
  url: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationsMenu() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    void (async () => {
      const result = await listUserNotificationsAction(20);
      if (result.ok) setItems(result.notifications);
    })();
  }, [open]);

  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <button type="button" aria-label="Notifications" className={cn("relative grid size-11 shrink-0 place-items-center rounded-full bg-muted text-foreground transition-colors outline-none hover:bg-border focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95") }>
            <Bell className="size-5" strokeWidth={1.75} />
            {unreadCount > 0 ? <span className="absolute top-3 right-3 size-2 rounded-full bg-primary ring-2 ring-muted" /> : null}
          </button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={10} className="w-80 rounded-2xl p-1.5 shadow-float">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between px-2.5 py-2 text-sm font-semibold">
            <span>Notifications</span>
            {unreadCount > 0 ? <span className="text-[10px] font-bold uppercase text-primary">{unreadCount} new</span> : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground">No notifications yet.</div>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <DropdownMenuItem key={item.id} className={cn("!cursor-default flex-col items-start rounded-xl px-2.5 py-2 text-left", !item.isRead && "bg-accent/50")}>
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
                  </div>
                  {!item.isRead ? <span className="mt-1 size-2 rounded-full bg-primary" /> : null}
                </div>
                <div className="mt-2 flex w-full items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                  {item.url ? (
                    <Link href={item.url} className="font-semibold text-primary" onClick={() => setOpen(false)}>
                      Open
                    </Link>
                  ) : null}
                </div>
                {!item.isRead ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await markUserNotificationReadAction({ notificationId: item.id });
                      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry));
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <CheckCheck className="size-3.5" strokeWidth={2} />
                    Mark read
                  </button>
                ) : null}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
