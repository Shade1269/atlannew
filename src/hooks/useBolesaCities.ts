import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://atlback-8yq4.vercel.app";

export interface BolesaCity {
  id: string | number;
  name: string;
  name_en?: string;
  code?: string;
}

// Global cache to persist across component remounts (useful for React Strict Mode)
const globalCitiesCache = {
  cities: [] as BolesaCity[],
  cityMap: {} as Record<string, string | number>,
  isLoaded: false,
  isLoading: false,
};

export const useBolesaCities = () => {
  const [cities, setCities] = useState<BolesaCity[]>(globalCitiesCache.cities);
  const [loading, setLoading] = useState(false);
  const [cityMap, setCityMap] = useState<Record<string, string | number>>(
    globalCitiesCache.cityMap
  );
  const { toast } = useToast();
  const toastRef = useRef(toast); // Store toast in ref to avoid dependency

  // Update toast ref whenever it changes
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // Initialize from cache if available
  useEffect(() => {
    if (globalCitiesCache.isLoaded && globalCitiesCache.cities.length > 0) {
      console.log(
        "[Bolesa Cities] Using cached cities:",
        globalCitiesCache.cities.length
      );
      setCities(globalCitiesCache.cities);
      setCityMap(globalCitiesCache.cityMap);
    }
  }, []);

  const fetchCities = useCallback(async (force: boolean = false) => {
    // Prevent multiple simultaneous fetches or re-fetching if already loaded (unless forced)
    if (!force && (globalCitiesCache.isLoading || globalCitiesCache.isLoaded)) {
      console.log("[Bolesa Cities] Already loading or loaded, using cache");
      if (globalCitiesCache.cities.length > 0) {
        setCities(globalCitiesCache.cities);
        setCityMap(globalCitiesCache.cityMap);
      }
      return;
    }

    globalCitiesCache.isLoading = true;
    setLoading(true);
    try {
      console.log("[Bolesa Cities] Fetching cities from API...");
      const response = await fetch(`${BACKEND_URL}/api/bolesa/cities`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch cities`);
      }

      const data = await response.json();

      console.log("[Bolesa Cities] API Response:", {
        success: data.success,
        hasCities: !!data.cities,
        citiesLength: data.cities?.length || 0,
        dataKeys: Object.keys(data),
        count: data.count,
      });

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch cities from Bolesa");
      }

      const citiesList = data.cities || data.data || [];

      // Only update if we got cities (prevent overwriting with empty array)
      if (citiesList.length > 0) {
        console.log("[Bolesa Cities] Parsed cities list:", {
          length: citiesList.length,
          firstFew: citiesList.slice(0, 3),
        });

        setCities(citiesList);

        // Create mapping: city name (Arabic) -> city_id
        const map: Record<string, string | number> = {};
        citiesList.forEach((city: BolesaCity) => {
          if (city.name) {
            map[city.name] = city.id;
          }
          if (city.name_en) {
            map[city.name_en] = city.id;
          }
        });
        setCityMap(map);

        // Update global cache
        globalCitiesCache.cities = citiesList;
        globalCitiesCache.cityMap = map;
        globalCitiesCache.isLoaded = true;

        console.log(
          `[Bolesa Cities] ✅ Loaded ${citiesList.length} cities and cached`
        );
      } else {
        console.warn("[Bolesa Cities] ⚠️ API returned empty cities array");
        // Only show warning/error if we haven't successfully loaded cities before
        // This prevents overwriting existing cities with empty array
        if (
          !globalCitiesCache.isLoaded ||
          globalCitiesCache.cities.length === 0
        ) {
          console.warn(
            "[Bolesa Cities] No cached cities available, showing error"
          );
          toastRef.current({
            title: "تحذير",
            description: "لم يتم العثور على مدن متاحة من Bolesa API",
            variant: "destructive",
          });
        } else {
          console.warn(
            "[Bolesa Cities] Keeping cached cities, not overwriting with empty array"
          );
          // Restore from cache
          setCities(globalCitiesCache.cities);
          setCityMap(globalCitiesCache.cityMap);
        }
      }
    } catch (error: any) {
      console.error("[Bolesa Cities] Error:", error.message);

      // If we have cached cities, use them instead of showing error
      if (globalCitiesCache.isLoaded && globalCitiesCache.cities.length > 0) {
        console.log("[Bolesa Cities] Using cached cities after error");
        setCities(globalCitiesCache.cities);
        setCityMap(globalCitiesCache.cityMap);
      } else {
        // Only show error if we don't have cached cities
        toastRef.current({
          title: "خطأ",
          description: "فشل في جلب المدن من Bolesa",
          variant: "destructive",
        });
      }
    } finally {
      globalCitiesCache.isLoading = false;
      setLoading(false);
    }
  }, []); // No dependencies - use refs instead

  useEffect(() => {
    // Only fetch if we don't have cached cities
    if (
      !globalCitiesCache.isLoaded &&
      !globalCitiesCache.isLoading &&
      cities.length === 0
    ) {
      console.log("[Bolesa Cities] useEffect: Fetching cities on mount");
      fetchCities();
    } else if (
      globalCitiesCache.isLoaded &&
      globalCitiesCache.cities.length > 0 &&
      cities.length === 0
    ) {
      // Restore from cache if component remounted
      console.log("[Bolesa Cities] useEffect: Restoring from cache");
      setCities(globalCitiesCache.cities);
      setCityMap(globalCitiesCache.cityMap);
    } else {
      console.log(
        "[Bolesa Cities] useEffect: Skipping fetch - already loaded or loading",
        {
          isLoaded: globalCitiesCache.isLoaded,
          isLoading: globalCitiesCache.isLoading,
          cachedCount: globalCitiesCache.cities.length,
          currentCount: cities.length,
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const getCityId = useCallback(
    (cityName: string): string | number | null => {
      return cityMap[cityName] || null;
    },
    [cityMap]
  );

  const refetch = useCallback(() => {
    // Reset cache to allow refetch
    globalCitiesCache.isLoaded = false;
    globalCitiesCache.isLoading = false;
    fetchCities(true);
  }, [fetchCities]);

  return {
    cities,
    loading,
    cityMap,
    getCityId,
    refetch,
  };
};
