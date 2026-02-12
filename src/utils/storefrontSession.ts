// Enhanced utility functions for managing storefront customer sessions

interface CustomerSessionData {
  sessionId: string;
  phone?: string;
  name?: string;
  email?: string;
  isVerified: boolean;
  expiresAt: number;
  storeId: string;
}

interface StorefrontSessionManager {
  getSession(): CustomerSessionData | null;
  setSession(data: CustomerSessionData): void;
  clearSession(): void;
  isSessionValid(): boolean;
  updateCustomerInfo(info: { phone?: string; name?: string; email?: string }): void;
}

// Session key utilities
export const getStorefrontSessionKey = (storeSlug: string): string => {
  return `sf:${storeSlug}:session_v2`;
};

export const getStorefrontCartKey = (storeSlug: string): string => {
  return `sf:${storeSlug}:cart`;
};

// Enhanced session manager class
export class StorefrontSession implements StorefrontSessionManager {
  private storeSlug: string;
  private sessionKey: string;

  constructor(storeSlug: string) {
    this.storeSlug = storeSlug;
    this.sessionKey = getStorefrontSessionKey(storeSlug);
  }

  getSession(): CustomerSessionData | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.sessionKey);
      if (!stored) return null;
      
      const session: CustomerSessionData = JSON.parse(stored);
      
      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }
      
      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  setSession(data: CustomerSessionData): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  clearSession(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(getStorefrontCartKey(this.storeSlug));
  }

  isSessionValid(): boolean {
    const session = this.getSession();
    return session !== null && session.isVerified && Date.now() < session.expiresAt;
  }

  updateCustomerInfo(info: { phone?: string; name?: string; email?: string }): void {
    const session = this.getSession();
    if (!session) return;
    
    const updatedSession = {
      ...session,
      ...info
    };
    
    this.setSession(updatedSession);
  }

  // Create new guest session
  createGuestSession(storeId: string): CustomerSessionData {
    const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    const session: CustomerSessionData = {
      sessionId,
      isVerified: false,
      expiresAt,
      storeId
    };
    
    this.setSession(session);
    return session;
  }

  // Verify session with OTP
  verifySession(phone: string, name?: string, email?: string): void {
    const session = this.getSession();
    if (!session) return;
    
    const verifiedSession: CustomerSessionData = {
      ...session,
      phone,
      name,
      email,
      isVerified: true,
      expiresAt: Date.now() + (100 * 365 * 24 * 60 * 60 * 1000) // دائم (100 سنة)
    };
    
    this.setSession(verifiedSession);
  }
}

// Utility functions (backwards compatibility)
export const saveStorefrontSession = (storeSlug: string, sessionId: string): void => {
  const manager = new StorefrontSession(storeSlug);
  const session = manager.getSession();
  
  if (session) {
    manager.setSession({ ...session, sessionId });
  }
};

export const getStorefrontSession = (storeSlug: string): string | null => {
  const manager = new StorefrontSession(storeSlug);
  const session = manager.getSession();
  return session?.sessionId || null;
};

export const clearStorefrontSession = (storeSlug: string): void => {
  const manager = new StorefrontSession(storeSlug);
  manager.clearSession();
};

export const isStorefrontSessionValid = async (
  storeSlug: string, 
  sessionId: string,
  supabaseClient: any
): Promise<boolean> => {
  try {
    const manager = new StorefrontSession(storeSlug);
    const session = manager.getSession();
    
    if (!session || session.sessionId !== sessionId) {
      return false;
    }
    
    // Check database validation for verified sessions
    if (session.isVerified) {
      const { error } = await supabaseClient.rpc('get_store_orders_for_session', {
        p_store_id: session.storeId,
        p_session_id: sessionId
      });
      
      return !error;
    }
    
    // For unverified sessions, just check local validity
    return manager.isSessionValid();
  } catch {
    return false;
  }
};