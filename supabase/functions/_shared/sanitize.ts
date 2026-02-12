/**
 * Input Sanitization Utility - تنظيف المدخلات
 *
 * Provides functions to sanitize user input and prevent XSS, SQL injection, etc.
 */

/**
 * Remove HTML tags from string
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(input: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };

  return input.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Sanitize string input (basic cleaning)
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
    .slice(0, 10000); // Limit length
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(input: unknown): string {
  if (typeof input !== "string") {
    return "";
  }

  const email = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return "";
  }

  return email.slice(0, 254); // Max email length per RFC
}

/**
 * Sanitize phone number (Saudi format)
 */
export function sanitizePhone(input: unknown): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove all non-digits
  const digits = input.replace(/\D/g, "");

  // Validate Saudi phone format
  if (digits.startsWith("966") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("05") && digits.length === 10) {
    return "966" + digits.slice(1);
  }

  if (digits.startsWith("5") && digits.length === 9) {
    return "966" + digits;
  }

  return "";
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(
  input: unknown,
  options: { min?: number; max?: number; decimals?: number } = {}
): number | null {
  const { min = -Infinity, max = Infinity, decimals = 2 } = options;

  let num: number;

  if (typeof input === "number") {
    num = input;
  } else if (typeof input === "string") {
    num = parseFloat(input);
  } else {
    return null;
  }

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  // Clamp to range
  num = Math.max(min, Math.min(max, num));

  // Round to decimals
  const factor = Math.pow(10, decimals);
  num = Math.round(num * factor) / factor;

  return num;
}

/**
 * Sanitize UUID
 */
export function sanitizeUuid(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const uuid = input.trim().toLowerCase();
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    return null;
  }

  return uuid;
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }

  try {
    const url = new URL(input.trim());

    // Only allow http and https
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize object - recursively sanitize all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T
): T {
  const result = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      (result as Record<string, unknown>)[key] = sanitizeString(value);
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeString(item)
          : item !== null && typeof item === "object"
          ? sanitizeObject(item as Record<string, unknown>)
          : item
      );
    } else {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

/**
 * Validate and sanitize request body
 */
export async function sanitizeRequestBody<T extends Record<string, unknown>>(
  request: Request
): Promise<T | null> {
  try {
    const body = await request.json();

    if (typeof body !== "object" || body === null) {
      return null;
    }

    return sanitizeObject(body as T);
  } catch {
    return null;
  }
}
