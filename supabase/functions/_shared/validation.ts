/**
 * Zod Validation Utility for Edge Functions
 * 
 * Provides type-safe request body validation with Arabic error messages.
 * 
 * @example
 * ```ts
 * import { validateBody, z } from '../_shared/validation.ts';
 * 
 * const OrderSchema = z.object({
 *   customer_name: z.string().min(2, 'الاسم مطلوب'),
 *   customer_phone: z.string().regex(/^05\d{8}$/, 'رقم الهاتف غير صحيح'),
 *   items: z.array(z.object({
 *     product_id: z.string().uuid(),
 *     quantity: z.number().positive(),
 *   })).min(1, 'أضف منتج واحد على الأقل'),
 * });
 * 
 * const result = await validateBody(req, OrderSchema);
 * if (!result.success) {
 *   return result.errorResponse; // 400 response with validation errors
 * }
 * 
 * const data = result.data; // Fully typed!
 * ```
 */

// Using esm.sh for Zod in Deno
import { z, ZodSchema, ZodError } from 'https://esm.sh/zod@3.22.4';

export { z };

interface ValidationSuccess<T> {
    success: true;
    data: T;
}

interface ValidationFailure {
    success: false;
    errors: { field: string; message: string }[];
    errorResponse: Response;
}

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Validate request body against a Zod schema
 * 
 * @param req - The incoming request
 * @param schema - Zod schema to validate against
 * @param corsHeaders - Optional CORS headers to include in error response
 */
export async function validateBody<T>(
    req: Request,
    schema: ZodSchema<T>,
    corsHeaders: Record<string, string> = {}
): Promise<ValidationResult<T>> {
    try {
        const body = await req.json();
        const result = schema.safeParse(body);

        if (!result.success) {
            return formatZodError(result.error, corsHeaders);
        }

        return {
            success: true,
            data: result.data,
        };
    } catch (error) {
        // JSON parsing error
        return {
            success: false,
            errors: [{ field: 'body', message: 'بيانات JSON غير صالحة' }],
            errorResponse: new Response(
                JSON.stringify({
                    success: false,
                    error: 'بيانات JSON غير صالحة',
                    errors: [{ field: 'body', message: 'بيانات JSON غير صالحة' }],
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            ),
        };
    }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(
    req: Request,
    schema: ZodSchema<T>,
    corsHeaders: Record<string, string> = {}
): ValidationResult<T> {
    const url = new URL(req.url);
    const params: Record<string, string> = {};

    url.searchParams.forEach((value, key) => {
        params[key] = value;
    });

    const result = schema.safeParse(params);

    if (!result.success) {
        return formatZodError(result.error, corsHeaders);
    }

    return {
        success: true,
        data: result.data,
    };
}

/**
 * Format Zod errors into a user-friendly response
 */
function formatZodError(
    error: ZodError,
    corsHeaders: Record<string, string>
): ValidationFailure {
    const errors = error.errors.map((err) => ({
        field: err.path.join('.') || 'unknown',
        message: err.message,
    }));

    const firstError = errors[0]?.message || 'بيانات غير صالحة';

    return {
        success: false,
        errors,
        errorResponse: new Response(
            JSON.stringify({
                success: false,
                error: firstError,
                errors,
            }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        ),
    };
}

// ============= Common Schemas =============

/**
 * Saudi phone number validation (05xxxxxxxx)
 */
export const saudiPhoneSchema = z
    .string()
    .regex(/^05\d{8}$/, 'رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام');

/**
 * Email validation with Arabic message
 */
export const emailSchema = z
    .string()
    .email('البريد الإلكتروني غير صالح');

/**
 * UUID validation
 */
export const uuidSchema = z
    .string()
    .uuid('معرف غير صالح');

/**
 * Positive number validation
 */
export const positiveNumberSchema = z
    .number()
    .positive('يجب أن يكون رقم موجب');

/**
 * Non-empty string validation
 */
export const requiredStringSchema = z
    .string()
    .min(1, 'هذا الحقل مطلوب');

/**
 * Optional nullable field wrapper
 */
export function optionalField<T extends ZodSchema>(schema: T) {
    return schema.optional().nullable();
}
