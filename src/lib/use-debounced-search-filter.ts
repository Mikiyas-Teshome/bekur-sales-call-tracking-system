"use client";

import { useEffect, useState } from "react";
import { useSearchParamsUpdater } from "@/lib/use-search-params-updater";

/**
 * A search input whose value is seeded from (and stays in sync with) the
 * current URL search param, and which pushes changes back to the URL after
 * a short debounce. Syncing from the prop happens during render (the
 * React-recommended pattern for "adjusting state when a prop changes"),
 * not in an effect, so it never causes an extra render pass.
 */
export function useDebouncedSearchFilter(currentValue: string, paramKey = "search", delayMs = 400) {
  const updateParams = useSearchParamsUpdater();
  const [trackedValue, setTrackedValue] = useState(currentValue);
  const [inputValue, setInputValue] = useState(currentValue);

  if (currentValue !== trackedValue) {
    setTrackedValue(currentValue);
    setInputValue(currentValue);
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      if (inputValue !== currentValue) updateParams({ [paramKey]: inputValue || null });
    }, delayMs);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  return [inputValue, setInputValue] as const;
}
