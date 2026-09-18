"use client";

import { useState, type ReactNode } from "react";
import { CommandLauncher } from "./command-launcher";
import { DesktopRail } from "./desktop-rail";
import { ForegroundPushListener } from "./foreground-push-listener";
import { LauncherProvider } from "./launcher-context";
import { MobileTabBar } from "./mobile-tab-bar";
import { NavigationDock } from "./navigation-dock";
import { RolePreviewBanner, RolePreviewProvider, type PreviewableRole } from "@/components/shared/role-preview";
import { WorkspaceHeader } from "./workspace-header";

export function AppShell({ children, roles }: { children: ReactNode; roles: PreviewableRole[] }) {
  const [dockOpen, setDockOpen] = useState(false);

  return (
    <RolePreviewProvider roles={roles}>
      <LauncherProvider>
        <ForegroundPushListener />
        <div className="min-h-dvh bg-background lg:h-dvh lg:overflow-hidden lg:bg-canvas">
          <DesktopRail />
          <NavigationDock open={dockOpen} onOpenChange={setDockOpen} />
          <CommandLauncher />
          <div className="lg:h-dvh lg:pl-20">
            <div className="flex min-h-dvh flex-col bg-background lg:my-3 lg:mr-3 lg:h-[calc(100dvh-1.5rem)] lg:min-h-0 lg:overflow-hidden lg:rounded-[28px] lg:shadow-workspace">
              <WorkspaceHeader onOpenDock={() => setDockOpen(true)} />
              <main className="flex-1 px-4 pt-2 pb-32 sm:px-6 lg:min-h-0 lg:overflow-y-auto lg:px-8 lg:pt-0 lg:pb-8">
                <RolePreviewBanner />
                {children}
              </main>
            </div>
          </div>
          <MobileTabBar />
        </div>
      </LauncherProvider>
    </RolePreviewProvider>
  );
}
