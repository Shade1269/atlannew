// Verify Two-Factor Authentication (2FA) code
// Supports TOTP codes and backup codes

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// TOTP implementation (same as setup-2fa)
class TOTP {
  private secret: string;
  private window: number;

  constructor(secret: string, window = 1) {
    this.secret = secret;
    this.window = window;
  }

  // Base32 decode
  private base32Decode(base32: string): Uint8Array {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    for (const char of base32.toUpperCase()) {
      const val = alphabet.indexOf(char);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, "0");
    }

    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
    }
    return bytes;
  }

  // Generate HMAC-SHA1
  private async hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
    const keyBuffer = new Uint8Array(key).buffer as ArrayBuffer;
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );
    const messageBuffer = new Uint8Array(message).buffer as ArrayBuffer;
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageBuffer);
    return new Uint8Array(signature);
  }

  // Generate TOTP token
  async generate(time?: number): Promise<string> {
    const epoch = Math.floor((time || Date.now()) / 1000);
    const timeCounter = Math.floor(epoch / 30);

    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, BigInt(timeCounter), false);

    const key = this.base32Decode(this.secret);
    const hmac = await this.hmacSha1(key, new Uint8Array(buffer));

    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return (code % 1000000).toString().padStart(6, "0");
  }

  // Verify TOTP token
  async verify(token: string, time?: number): Promise<boolean> {
    const epoch = Math.floor((time || Date.now()) / 1000);

    for (let i = -this.window; i <= this.window; i++) {
      const testTime = (epoch + i * 30) * 1000;
      const valid = await this.generate(testTime);
      if (valid === token) {
        return true;
      }
    }
    return false;
  }
}

// Hash backup code for comparison
async function hashBackupCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Get request body
    const { code, enableAfterVerify = false } = await req.json();

    if (!code) {
      throw new Error("Code is required");
    }

    // Get user's 2FA settings
    const { data: twoFactorAuth, error: fetchError } = await supabase
      .from("two_factor_auth")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !twoFactorAuth) {
      throw new Error("2FA not setup for this user");
    }

    let isValid = false;
    let usedBackupCode = false;

    // Try TOTP verification first (6-digit code)
    if (code.length === 6 && /^\d+$/.test(code)) {
      const totp = new TOTP(twoFactorAuth.secret, 1);
      isValid = await totp.verify(code);
    }

    // If TOTP failed, try backup code (8-character hex)
    if (!isValid && code.length === 8) {
      const hashedCode = await hashBackupCode(code.toUpperCase());
      const backupCodes = twoFactorAuth.backup_codes || [];

      if (backupCodes.includes(hashedCode)) {
        isValid = true;
        usedBackupCode = true;

        // Remove used backup code
        const updatedBackupCodes = backupCodes.filter((c: string) => c !== hashedCode);
        await supabase
          .from("two_factor_auth")
          .update({ backup_codes: updatedBackupCodes })
          .eq("user_id", user.id);
      }
    }

    // Log attempt
    const attemptData = {
      user_id: user.id,
      success: isValid,
      method: usedBackupCode ? "backup_code" : "totp",
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
    };

    await supabase.from("two_factor_auth_attempts").insert(attemptData);

    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid code. Please try again.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If this is the first verification after setup, enable 2FA
    if (enableAfterVerify && !twoFactorAuth.enabled) {
      await supabase
        .from("two_factor_auth")
        .update({
          enabled: true,
          verified: true,
          enabled_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "2FA has been enabled successfully!",
          enabled: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update last used timestamp
    await supabase
      .from("two_factor_auth")
      .update({ last_used_at: new Date().toISOString() })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: usedBackupCode
          ? "Backup code verified successfully. This code cannot be used again."
          : "Code verified successfully!",
        usedBackupCode,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in verify-2fa:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
