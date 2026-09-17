"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type LauncherContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const LauncherContext = createContext<LauncherContextValue | null>(null);

export function LauncherProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return <LauncherContext.Provider value={{ open, setOpen }}>{children}</LauncherContext.Provider>;
}

export function useLauncher() {
  const context = useContext(LauncherContext);
  if (!context) throw new Error("useLauncher must be used inside LauncherProvider");
  return context;
}
