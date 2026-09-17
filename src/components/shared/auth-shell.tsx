import type { ReactNode } from "react";
import { BrandMark } from "@/components/shared/app-shell/brand-mark";
import { Surface } from "@/components/shared/surface";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-muted px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <BrandMark />
          <div className="text-center leading-tight">
            <p className="text-base font-bold">Bekur</p>
            <p className="text-xs text-muted-foreground">Sales workspace</p>
          </div>
        </div>
        <Surface className="p-6 sm:p-8">{children}</Surface>
      </div>
    </div>
  );
}
