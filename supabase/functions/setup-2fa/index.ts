// Setup Two-Factor Authentication (2FA) for a user
// Generates TOTP secret, QR code data, and backup codes

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// TOTP implementation using crypto
class TOTP {
  private secret: string;
  private window: number;

  constructor(secret: string, window = 1) {
    this.secret = secret;
    this.window = window;
  }

  // Generate a random Base32 secret
  static generateSecret(length = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      secret += chars[array[i] % chars.length];
    }
    return secret;
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

// Generate backup codes
function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    const code = Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    codes.push(code);
  }
  return codes;
}

// Hash backup code for storage
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

    // Check if user already has 2FA setup
    const { data: existing } = await supabase
      .from("two_factor_auth")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existing && existing.enabled) {
      return new Response(
        JSON.stringify({
          error: "2FA is already enabled. Disable it first to re-setup.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate TOTP secret
    const secret = TOTP.generateSecret(32);

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => hashBackupCode(code))
    );

    // Get user email for QR code
    const userEmail = user.email || "user@atlantis.com";

    // Generate QR code data URL (otpauth://)
    const issuer = "Atlantis";
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(
      issuer
    )}:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=${encodeURIComponent(
      issuer
    )}`;

    // Store in database (but not enabled yet - user must verify first)
    const { error: upsertError } = await supabase
      .from("two_factor_auth")
      .upsert(
        {
          user_id: user.id,
          secret: secret,
          enabled: false,
          verified: false,
          method: "totp",
          backup_codes: hashedBackupCodes,
        },
        {
          onConflict: "user_id",
        }
      );

    if (upsertError) {
      console.error("Error storing 2FA setup:", upsertError);
      throw new Error("Failed to setup 2FA");
    }

    // Return secret, QR data, and backup codes (plain text - show only once!)
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          secret: secret,
          qrCodeUrl: otpauthUrl,
          backupCodes: backupCodes, // Show these only once!
          message:
            "Scan the QR code with your authenticator app, then verify with a code to enable 2FA.",
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in setup-2fa:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
