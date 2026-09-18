"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Returns a function that merges the given patch into the current URL's
 * search params and navigates there. Any key set to `null` is removed.
 * Unless `page` is explicitly included in the patch, it's reset (removed)
 * since changing a filter should always return to page 1.
 */
export function useSearchParamsUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) params.delete(key);
        else params.set(key, value);
      }
      if (!("page" in patch)) params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );
}
