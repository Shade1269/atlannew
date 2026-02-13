import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getBaseUrl } from "@/utils/domains";
import { performSignUpRuntime } from "./performSignUpRuntime";

export interface FastUserProfile {
  id: string;
  auth_user_id: string | null;
  email: string | null;
  full_name: string | null;
  role:
    | "admin"
    | "affiliate"
    | "marketer"
    | "merchant"
    | "customer"
    | "moderator";
  level: "bronze" | "silver" | "gold" | "legendary";
  is_active: boolean;
  points?: number;
  total_earnings?: number;
  avatar_url?: string | null;
  phone?: string | null;
  created_at?: string | null;
}

export type FastAuthRole = "admin" | "affiliate" | "marketer" | "merchant";

/** بيانات إضافية عند التسجيل كتاجر */
export interface MerchantSignUpData {
  phone: string;
  address: string;
  commercial_registry_url: string;
}

export interface FastAuthSignUpArgs {
  email: string;
  password: string;
  fullName: string;
  username: string;
  role: FastAuthRole;
  /** مطلوب عند role === "merchant" */
  merchantData?: MerchantSignUpData;
}

export interface SignUpServices {
  supabase: typeof supabase;
  toast: (config: {
    title: string;
    description?: string;
    variant?: string;
  }) => void;
  fetchUserProfile: (
    userId: string,
    useCache?: boolean
  ) => Promise<FastUserProfile | null>;
  getBaseUrlFn?: () => string;
}

export const performSignUp: (
  deps: SignUpServices,
  args: FastAuthSignUpArgs
) => Promise<{ data?: any; error: any }> = (deps, args) => {
  const enhancedDeps = {
    ...deps,
    getBaseUrlFn: deps.getBaseUrlFn ?? getBaseUrl,
  };

  return performSignUpRuntime(enhancedDeps, args) as Promise<{
    data?: any;
    error: any;
  }>;
};

// Memory cache for user data
const userCache = {
  profile: null as FastUserProfile | null,
  userId: null as string | null, // Track which user the cache belongs to
  timestamp: 0,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

// LocalStorage keys
const STORAGE_KEYS = {
  USER_PROFILE: "fast_user_profile",
  LAST_UPDATE: "profile_last_update",
};

export const useFastAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<FastUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Get cached profile from memory or localStorage
  const getCachedProfile = useCallback((userId: string) => {
    const now = Date.now();

    // Check if cache is for the same user
    if (userCache.userId !== userId) {
      return null;
    }

    // Check memory cache first
    if (
      userCache.profile &&
      now - userCache.timestamp < userCache.CACHE_DURATION
    ) {
      return userCache.profile;
    }

    // Check localStorage
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      const lastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
      const cachedUserId = localStorage.getItem(
        STORAGE_KEYS.USER_PROFILE + "_uid"
      );

      if (cached && lastUpdate && cachedUserId === userId) {
        const timeDiff = now - parseInt(lastUpdate);
        if (timeDiff < userCache.CACHE_DURATION) {
          const profileData = JSON.parse(cached);
          // Update memory cache
          userCache.profile = profileData;
          userCache.userId = userId;
          userCache.timestamp = now;
          return profileData;
        }
      }
    } catch (error) {
      console.error("Error reading cached profile:", error);
    }

    return null;
  }, []);

  // Cache profile in memory and localStorage
  const cacheProfile = useCallback((profileData: FastUserProfile) => {
    const now = Date.now();

    // Update memory cache
    userCache.profile = profileData;
    userCache.userId = profileData.auth_user_id;
    userCache.timestamp = now;

    // Update localStorage
    try {
      localStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(profileData)
      );
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, now.toString());
      if (profileData.auth_user_id) {
        localStorage.setItem(
          STORAGE_KEYS.USER_PROFILE + "_uid",
          profileData.auth_user_id
        );
      }
    } catch (error) {
      console.error("Error caching profile:", error);
    }
  }, []);

  // Fetch user profile with optimized query
  const fetchUserProfile = useCallback(
    async (userId: string, useCache = true) => {
      if (useCache) {
        const cached = getCachedProfile(userId);
        if (cached) {
          setProfile(cached);
          return cached;
        }
      }

      try {
        // Optimized query - select only necessary fields
        // Use profiles table only (user_profiles is frozen/read-only)
        const { data: p, error: pErr } = await supabase
          .from("profiles")
          .select(
            "id, auth_user_id, email, full_name, role, level, is_active, points, total_earnings, avatar_url, phone, created_at"
          )
          .eq("auth_user_id", userId)
          .maybeSingle();

        if (pErr) {
          console.error("[useFastAuth] Error fetching profiles:", pErr);
          return null;
        }

        if (!p) {
          console.warn("[useFastAuth] No profile found for user:", userId);
          return null;
        }

        let data = { ...p, level: (p as any).level ?? "bronze" } as any;

        const profileData = data as FastUserProfile;
        setProfile(profileData);
        cacheProfile(profileData);
        return profileData;
      } catch (error: any) {
        const isNetworkError =
          error?.message === "Failed to fetch" ||
          (typeof error?.message === "string" && error.message.toLowerCase().includes("network")) ||
          (typeof error?.message === "string" && error.message.toLowerCase().includes("connection"));
        if (isNetworkError && useCache !== false) {
          try {
            await new Promise((r) => setTimeout(r, 1500));
            const { data: p, error: pErr } = await supabase
              .from("profiles")
              .select("id, auth_user_id, email, full_name, role, level, is_active, points, total_earnings, avatar_url, phone, created_at")
              .eq("auth_user_id", userId)
              .maybeSingle();
            if (!pErr && p) {
              const profileData = { ...p, level: (p as any).level ?? "bronze" } as FastUserProfile;
              setProfile(profileData);
              cacheProfile(profileData);
              return profileData;
            }
          } catch (_) {
            // ignore retry failure
          }
        }
        console.error("[useFastAuth] Error fetching profiles:", error?.message || error);
        return null;
      }
    },
    [getCachedProfile, cacheProfile]
  );

  // Fast role check without database query
  const hasRole = useCallback(
    (requiredRole: string | string[]) => {
      if (!profile) return false;

      if (Array.isArray(requiredRole)) {
        return requiredRole.includes(profile.role);
      }

      return profile.role === requiredRole;
    },
    [profile]
  );

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Get existing session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserProfile(session.user.id, true);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Defer profile fetch to avoid deadlocks inside auth callback
        // Check isMounted inside timeout to prevent setState on unmounted component
        const userId = session.user.id;
        setTimeout(() => {
          if (isMounted && userId) {
            fetchUserProfile(userId, false);
          }
        }, 0);
      } else {
        // Clear cache on logout (guarded for Safari private mode)
        userCache.profile = null;
        userCache.userId = null;
        userCache.timestamp = 0;
        try {
          if (typeof window !== "undefined") {
            window.localStorage?.removeItem(STORAGE_KEYS.USER_PROFILE);
            window.localStorage?.removeItem(STORAGE_KEYS.LAST_UPDATE);
            window.localStorage?.removeItem(STORAGE_KEYS.USER_PROFILE + "_uid");
          }
        } catch (e) {
          console.warn("LocalStorage not available while clearing cache:", e);
        }
      }

      setLoading(false);
    });

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (user) {
      return await fetchUserProfile(user.id, false);
    }
    return null;
  }, [user, fetchUserProfile]);

  // Clear cache manually
  const clearCache = useCallback(() => {
    userCache.profile = null;
    userCache.userId = null;
    userCache.timestamp = 0;
    try {
      if (typeof window !== "undefined") {
        window.localStorage?.removeItem(STORAGE_KEYS.USER_PROFILE);
        window.localStorage?.removeItem(STORAGE_KEYS.LAST_UPDATE);
        window.localStorage?.removeItem(STORAGE_KEYS.USER_PROFILE + "_uid");
      }
    } catch (e) {
      console.warn("LocalStorage not available while clearing cache:", e);
    }
  }, []);

  // Enhanced Auth functions with better error handling and user feedback
  const signUp = useCallback(
    (args: FastAuthSignUpArgs) => {
      return performSignUp(
        { supabase, toast: (config: any) => toast(config), fetchUserProfile },
        args
      );
    },
    [toast, fetchUserProfile]
  );

  const signIn = async (email: string, password: string) => {
    try {
      // Validate input
      if (!email || !email.trim()) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "يرجى إدخال البريد الإلكتروني",
          variant: "destructive",
        });
        return { error: { message: "Email is required" } };
      }

      if (!password || !password.trim()) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "يرجى إدخال كلمة المرور",
          variant: "destructive",
        });
        return { error: { message: "Password is required" } };
      }

      // Normalize email (trim and lowercase)
      const normalizedEmail = email.trim().toLowerCase();

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "تنسيق البريد الإلكتروني غير صحيح",
          variant: "destructive",
        });
        return { error: { message: "Invalid email format" } };
      }

      console.log(
        "[SignIn] Attempting to sign in with email:",
        normalizedEmail
      );

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password.trim(),
      });

      if (error) {
        console.error("[SignIn] Error details:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });

        let errorMessage = error.message;

        if (error.message === "Invalid login credentials") {
          errorMessage =
            "البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد من البيانات أو أنشئ حساب جديد.";
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "البريد الإلكتروني غير صحيح";
        } else if (error.message.includes("too many requests")) {
          errorMessage = "محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى";
        } else if (
          error.message.includes("Email not confirmed") ||
          error.message.includes("email_not_confirmed")
        ) {
          // Try to resend confirmation email automatically
          try {
            const { error: resendError } = await supabase.auth.resend({
              type: "signup",
              email: normalizedEmail,
            });

            if (!resendError) {
              errorMessage =
                "تم إرسال رسالة تأكيد جديدة إلى بريدك الإلكتروني. تحقق من صندوق الوارد والمجلدات المهملة";
            } else {
              errorMessage =
                "البريد الإلكتروني غير مؤكد. تحقق من بريدك الإلكتروني أو حاول مرة أخرى لاحقاً";
            }
          } catch (resendErr) {
            console.error("Error resending confirmation:", resendErr);
            errorMessage =
              "البريد الإلكتروني غير مؤكد. تحقق من بريدك الإلكتروني";
          }
        }

        // Handle 400 Bad Request specifically
        if (error.status === 400) {
          if (
            !error.message.includes("Invalid login credentials") &&
            !error.message.includes("Email not confirmed") &&
            !error.message.includes("email_not_confirmed")
          ) {
            errorMessage =
              errorMessage ||
              "بيانات تسجيل الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور";
          }
        }

        toast({
          title: "خطأ في تسجيل الدخول",
          description: errorMessage,
          variant: "destructive",
        });

        return { error };
      }

      console.log("[SignIn] Successfully signed in:", data.user?.id);

      // Check and create profile if needed (using profiles table only)
      if (data?.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("auth_user_id", data.user.id)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("[SignIn] Error checking profile:", profileError);
        }

        if (!profile) {
          // Create profile if doesn't exist (profiles table only, user_profiles is frozen)
          // Use upsert to handle case where profile exists but RLS prevented reading it
          const { data: insertedProfile, error: insertError } = await supabase
            .from("profiles")
            .upsert(
              {
                auth_user_id: data.user.id,
                email: data.user.email,
                full_name:
                  data.user.user_metadata?.full_name || data.user.email,
                role: "affiliate",
                is_active: true,
                points: 0,
                level: "bronze",
              },
              {
                onConflict: "auth_user_id",
                ignoreDuplicates: false,
              }
            )
            .select("*")
            .maybeSingle();

          if (insertError) {
            console.error(
              "[SignIn] Error creating/updating profile:",
              insertError
            );
            // Check if it's a duplicate error (409) - profile might already exist
            if (
              insertError.code === "23505" ||
              insertError.message.includes("duplicate")
            ) {
              console.log(
                "[SignIn] Profile might already exist, trying to fetch again..."
              );
              // Try to fetch profile again after a short delay
              setTimeout(async () => {
                await fetchUserProfile(data.user.id, false);
              }, 500);
            } else {
              toast({
                title: "تحذير",
                description:
                  "تم تسجيل الدخول بنجاح لكن حدث خطأ في إنشاء الملف الشخصي",
                variant: "destructive",
              });
            }
          } else if (insertedProfile) {
            console.log("[SignIn] Profile created/updated successfully");
            // Refresh profile to get latest data
            await fetchUserProfile(data.user.id, false);
          }
        } else {
          // Profile exists, refresh it to ensure we have latest data
          await fetchUserProfile(data.user.id, false);
        }
      }

      toast({
        title: "مرحباً بعودتك!",
        description: "تم تسجيل الدخول بنجاح",
      });

      // Determine redirect path based on role (returned to caller; no hard reload)
      const userId = data.user?.id;
      let redirect = "/";
      if (userId) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("auth_user_id", userId)
          .maybeSingle();
        const role = prof?.role as FastUserProfile["role"] | undefined;
        switch (role) {
          case "admin":
            redirect = "/admin/dashboard";
            break;
          case "moderator":
            redirect = "/admin/dashboard";
            break;
          case "affiliate":
            redirect = "/affiliate";
            break;
          case "merchant":
            redirect = "/merchant";
            break;
          default:
            redirect = "/";
        }
      }
      // Don't force reload; let caller navigate
      return { data, error: null, redirect };
    } catch (error: any) {
      console.error("SignIn error:", error);

      let errorMessage = "حدث خطأ أثناء تسجيل الدخول";
      if (error.message.includes("network")) {
        errorMessage = "تحقق من اتصال الإنترنت وحاول مرة أخرى";
      }

      toast({
        title: "خطأ في تسجيل الدخول",
        description: errorMessage,
        variant: "destructive",
      });

      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Always clear local state first
      setUser(null);
      setSession(null);
      setProfile(null);
      clearCache();

      // Try to sign out from Supabase (but don't fail if session is invalid)
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.log("Supabase signOut error (ignored):", error);
      }

      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "إلى اللقاء!",
      });

      // Don't force reload; let caller handle navigation/guards

      return { error: null };
    } catch (error: any) {
      console.error("SignOut error:", error);

      toast({
        title: "خطأ في تسجيل الخروج",
        description: error.message,
        variant: "destructive",
      });

      // Even if there's an error, clear local state
      setUser(null);
      setSession(null);
      setProfile(null);
      clearCache();

      // Don't force reload on error; state already cleared

      return { error: null }; // Return success since we cleared local state
    }
  };

  const updateProfile = async (updates: any) => {
    if (!user) return { error: "No user found" };

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("auth_user_id", user.id)
        .select()
        .maybeSingle();

      if (error) {
        return { error };
      }

      // Update cached profile
      if (data) {
        cacheProfile(data as FastUserProfile);
        setProfile(data as FastUserProfile);
      }

      return { data, error: null };
    } catch (error) {
      console.error("Profile update error:", error);
      return { error };
    }
  };

  // Fetch affiliate data with caching
  const fetchAffiliateData = useCallback(
    async (profileId: string) => {
      const cacheKey = `affiliate-data-${profileId}`;
      const cached = getCachedProfile(cacheKey);
      if (cached) return cached;

      try {
        const { data: stores, error: storesError } = await supabase
          .from("affiliate_stores")
          .select("*")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (storesError) throw storesError;

        const storeData = Array.isArray(stores) ? stores[0] : null;
        const result = {
          store: storeData,
          products: [] as any[],
          commissions: [] as any[],
          stats: {
            totalCommissions: 0,
            totalSales: storeData?.total_sales || 0,
            activeProducts: 0,
          },
        };

        if (storeData?.id) {
          const [productsRes, commissionsRes] = await Promise.allSettled([
            supabase
              .from("affiliate_products")
              .select("*, products (*)")
              .eq("affiliate_store_id", storeData.id)
              .eq("is_visible", true),
            supabase
              .from("commissions")
              .select("*")
              .eq("affiliate_id", profileId)
              .order("created_at", { ascending: false })
              .limit(10),
          ]);

          if (productsRes.status === "fulfilled" && !productsRes.value.error) {
            result.products = (productsRes.value.data || []) as any[];
            result.stats.activeProducts = result.products.length;
          }

          if (
            commissionsRes.status === "fulfilled" &&
            !commissionsRes.value.error
          ) {
            result.commissions = (commissionsRes.value.data || []) as any[];
            result.stats.totalCommissions = result.commissions.reduce(
              (sum: number, c: any) => sum + (c.amount_sar || 0),
              0
            );
          }
        }

        cacheProfile(result as any);
        return result;
      } catch (error) {
        console.error("Error fetching affiliate data:", error);
        return null;
      }
    },
    [getCachedProfile, cacheProfile]
  );

  return {
    // Auth state
    user,
    session,
    profile,
    loading,

    // Auth status
    isAuthenticated: !!user,
    isActive: profile?.is_active ?? false,

    // Role checks (cached and fast)
    isAdmin: hasRole("admin"),
    isAffiliate: hasRole("affiliate"),
    isCustomer: hasRole("customer"),
    isModerator: hasRole("moderator"),

    // Auth functions
    signUp,
    signIn,
    signOut,
    updateProfile,

    // Helper functions
    hasRole,
    refreshProfile,
    clearCache,
    fetchAffiliateData,

    // Role helpers
    canModerate: hasRole(["admin", "moderator"]),
    canManageUsers: hasRole("admin"),
    canCreateShops: hasRole("admin"),
    canViewAnalytics: hasRole(["admin", "affiliate"]),
  };
};
