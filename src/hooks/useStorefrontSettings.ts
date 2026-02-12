import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StorefrontSettingsService } from "../services/StorefrontSettingsService";

export interface StorefrontSettings {
  storeName: string;
  shortDescription: string;
  logoUrl: string;
  accentColor: string;
  useThemeHero: boolean;
}

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettings = {
  storeName: "",
  shortDescription: "",
  logoUrl: "",
  accentColor: "var(--accent)",
  useThemeHero: true,
};

export interface StorefrontSettingsOptions {
  initialSettings?: Partial<StorefrontSettings>;
  persist?: boolean;
}

export const useStorefrontSettings = (
  slug: string,
  options: StorefrontSettingsOptions = {}
) => {
  const queryClient = useQueryClient();
  const persist = options.persist ?? true;

  // Query for fetching settings
  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ["storefront-settings", slug],
    queryFn: () => StorefrontSettingsService.getSettings(slug),
    enabled: !!slug && persist,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for saving settings
  const mutation = useMutation({
    mutationFn: (newSettings: StorefrontSettings) =>
      StorefrontSettingsService.saveSettings(slug, newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront-settings", slug] });
    },
  });

  // Merge default, initial, and server settings
  const settings = useMemo(() => {
    // If we have server data, it takes precedence over defaults
    // If not, we fall back to initialSettings or defaults
    const base = { ...DEFAULT_STOREFRONT_SETTINGS, ...(options.initialSettings ?? {}) };

    if (serverSettings) {
      return { ...base, ...serverSettings };
    }

    return base;
  }, [serverSettings, options.initialSettings]);

  const updateSettings = useCallback(
    (partial: Partial<StorefrontSettings>) => {
      const nextSettings = { ...settings, ...partial };

      // Optimistically update or just trigger mutation
      if (persist && slug) {
        mutation.mutate(nextSettings);
      }
    },
    [settings, persist, slug, mutation]
  );

  const resetSettings = useCallback(() => {
    // Reset to defaults (and save if persisting)
    const resetValue = { ...DEFAULT_STOREFRONT_SETTINGS, ...(options.initialSettings ?? {}) };
    if (persist && slug) {
      mutation.mutate(resetValue);
    }
  }, [persist, slug, options.initialSettings, mutation]);

  return { settings, updateSettings, resetSettings, isLoading, isSaving: mutation.isPending };
};

export type { StorefrontSettingsOptions as UseStorefrontSettingsOptions };
