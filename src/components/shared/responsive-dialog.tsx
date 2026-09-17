"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { softPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

type ResponsiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  contentClassName?: string;
};

export function ResponsiveDialog({ open, onOpenChange, title, description, children, contentClassName }: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} className={cn("max-w-xl gap-0 rounded-3xl p-0", contentClassName)}>
          <div className="flex items-start justify-between px-5 pt-5">
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">{title}</DialogTitle>
              <DialogDescription className="mt-1">{description}</DialogDescription>
            </div>
            <button type="button" aria-label="Close dialog" onClick={() => onOpenChange(false)} className={cn(softPillClass, "grid size-11 shrink-0 place-items-center rounded-full p-0")}>
              <X className="size-5" strokeWidth={1.75} />
            </button>
          </div>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false} side="bottom" className={cn("max-h-[92dvh] gap-0 overflow-y-auto rounded-t-[28px] p-0", contentClassName)}>
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border" />
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <SheetTitle className="text-xl font-bold tracking-tight">{title}</SheetTitle>
            <SheetDescription className="mt-1">{description}</SheetDescription>
          </div>
          <button type="button" aria-label="Close dialog" onClick={() => onOpenChange(false)} className={cn(softPillClass, "grid size-11 shrink-0 place-items-center rounded-full p-0")}>
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        {children}
      </SheetContent>
    </Sheet>
  );
}
