import { useState, useEffect } from "react";
import { supabasePublic } from "@/integrations/supabase/publicClient";
import { StorefrontSession } from "@/utils/storefrontSession";

interface StorefrontSessionData {
  sessionId: string;
  storeId: string;
  cartId?: string;
}

export const useStorefrontSession = (storeSlug: string, storeId?: string) => {
  const [session, setSession] = useState<StorefrontSessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeSlug) return;

    const initializeSession = async () => {
      try {
        setLoading(true);

        // إنشاء أو الحصول على جلسة المتجر
        const storefrontSession = new StorefrontSession(storeSlug);
        let sessionData = storefrontSession.getSession();

        if (!sessionData && storeId) {
          // إنشاء جلسة جديدة
          sessionData = storefrontSession.createGuestSession(storeId);
        }

        if (sessionData) {
          // البحث عن أو إنشاء سلة للجلسة
          let cartId = await getOrCreateCart(
            sessionData.sessionId,
            storeId || sessionData.storeId,
          );

          setSession({
            sessionId: sessionData.sessionId,
            storeId: storeId || sessionData.storeId,
            cartId,
          });
        }
      } catch (error) {
        console.error("Error initializing storefront session:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [storeSlug, storeId]);

  const getOrCreateCart = async (
    sessionId: string,
    storeId: string,
  ): Promise<string | undefined> => {
    try {
      // البحث عن سلة موجودة
      const { data: existingCart } = await supabasePublic
        .from("shopping_carts")
        .select("id")
        .eq("session_id", sessionId)
        .eq("affiliate_store_id", storeId)
        .maybeSingle();

      if (existingCart) {
        return existingCart.id;
      }

      // إنشاء سلة جديدة
      const { data: newCart, error } = await supabasePublic
        .from("shopping_carts")
        .insert({
          session_id: sessionId,
          affiliate_store_id: storeId,
          user_id: null, // جلسة زائر
        })
        .select("id")
        .single();

      if (error) throw error;
      return newCart.id;
    } catch (error) {
      console.error("Error managing cart:", error);
      return undefined;
    }
  };

  const clearSession = () => {
    const storefrontSession = new StorefrontSession(storeSlug);
    storefrontSession.clearSession();
    setSession(null);
  };

  return {
    session,
    loading,
    clearSession,
  };
};
