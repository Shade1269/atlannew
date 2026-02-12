// imageExtractors.ts
// جاهز للنسخ والاستخدام مباشرة

type AnyObj = Record<string, any>;

/** نسمح فقط بروابط http/https */
const isHttpUrl = (v: unknown): v is string =>
  typeof v === "string" && /^(https?:)\/\//i.test(v.trim());

/** إزالة التكرار مع الحفاظ على الترتيب */
export const uniqUrls = (arr: string[]) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of arr) {
    const key = u.trim();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
};

/** محاولة آمنة لـ JSON.parse */
const tryParseJson = (s: unknown): any | null => {
  if (typeof s !== "string") return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

/** نحاول استخراج URL من عنصر واحد (string | object) */
const pickUrlFromObject = (o: AnyObj): string | null => {
  if (!o || typeof o !== "object") return null;
  const candidates = [
    o.url,
    o.src,
    o.image_url,
    o.imageUrl,
    o.image,
  ];
  return candidates.find(isHttpUrl) ?? null;
};

/** نجمع URLs من قيمة واحدة قد تكون:
 *  - String (رابط مباشر أو JSON-string لمصفوفة/كائنات)
 *  - Array (strings/objects)
 *  - Object (فيه url/src/image_url/...)
 */
const collectUrlsFromUnknown = (val: any): string[] => {
  const urls: string[] = [];

  // 1) string: قد تكون URL مباشرة أو JSON-string
  if (typeof val === "string") {
    if (isHttpUrl(val)) {
      urls.push(val);
      return urls;
    }
    const parsed = tryParseJson(val);
    if (parsed != null) {
      urls.push(...collectUrlsFromUnknown(parsed));
    }
    return urls;
  }

  // 2) array
  if (Array.isArray(val)) {
    for (const item of val) {
      if (typeof item === "string" && isHttpUrl(item)) {
        urls.push(item);
      } else if (item && typeof item === "object") {
        const u = pickUrlFromObject(item);
        if (u) urls.push(u);
        else {
          // في حال كان العنصر كائن متداخل آخر
          urls.push(...collectUrlsFromUnknown(item));
        }
      }
    }
    return urls;
  }

  // 3) object
  if (val && typeof val === "object") {
    const direct = pickUrlFromObject(val);
    if (direct) urls.push(direct);

    // نجرب المرور على جميع القيم الداخلية (احترازيًا)
    for (const key of Object.keys(val)) {
      urls.push(...collectUrlsFromUnknown(val[key]));
    }
  }

  return urls;
};


/** الحقول المعروفة التي قد تحتوي صورًا بشكل مباشر أو كمصفوفات */
const DIRECT_STRING_FIELDS = [
  "image_url",
  "imageUrl",
  "image",
] as const;

const ARRAY_FIELDS = [
  "image_urls",
  "imageUrls",
  "images",
  "photos",
  "pictures",
] as const;

/** الحقول المتداخلة الشائعة */
const NESTED_FIELDS = [
  // media وأحيانًا media.images تحتوي عناصر {url|src}
  "media",
  // gallery قد تكون مصفوفة strings أو objects
  "gallery",
  // assets: [{url|src|image_url}, ...]
  "assets",
] as const;

/** استخراج صور من variant واحد */
export const extractImagesFromVariant = (variant: AnyObj): string[] => {
  if (!variant || typeof variant !== "object") return [];

  const out: string[] = [];

  // 1) الحقول المباشرة كسلاسل
  for (const f of DIRECT_STRING_FIELDS) {
    const v = variant?.[f];
    if (isHttpUrl(v)) out.push(v);
  }

  // 2) الحقول التي قد تكون Array أو JSON-string
  for (const f of ARRAY_FIELDS) {
    const v = variant?.[f];
    if (!v) continue;
    out.push(...collectUrlsFromUnknown(v));
  }

  // 3) الحقول المتداخلة المعروفة
  for (const f of NESTED_FIELDS) {
    const v = variant?.[f];
    if (!v) continue;
    out.push(...collectUrlsFromUnknown(v));
  }

  // 4) فحص شامل احترازي لأي مفاتيح أخرى قد تحتوي JSON-string لصور
  for (const [k, v] of Object.entries(variant)) {
    // نتجنب إعادة فحص الحقول التي فحصناها
    if (
      DIRECT_STRING_FIELDS.includes(k as any) ||
      ARRAY_FIELDS.includes(k as any) ||
      NESTED_FIELDS.includes(k as any)
    ) {
      continue;
    }
    // إذا كانت قيمة نصية وقابلة للتحويل لمصفوفة/كائن صور — نجرب
    if (typeof v === "string") {
      const parsed = tryParseJson(v);
      if (parsed != null) out.push(...collectUrlsFromUnknown(parsed));
    }
  }

  // فلترة http/https + إزالة التكرار
  return uniqUrls(out.filter(isHttpUrl));
};

/** استخراج كل صور المنتج (top/src + variants) */
export const extractAllProductImages = (p: AnyObj) => {
  const src = p?.products ?? p ?? {};

  // 1) اجمع صور المنتج نفسه (ليس فقط image_urls)
  const productLevel: string[] = [];
  const collectFrom = (obj: AnyObj | undefined | null) => {
    if (!obj || typeof obj !== 'object') return;
    // direct string fields
    for (const f of DIRECT_STRING_FIELDS) {
      const v = (obj as any)[f];
      if (isHttpUrl(v)) productLevel.push(v);
    }
    // array or JSON-string fields
    for (const f of ARRAY_FIELDS) {
      const v = (obj as any)[f];
      if (v) productLevel.push(...collectUrlsFromUnknown(v));
    }
    // nested common containers
    for (const f of NESTED_FIELDS) {
      const v = (obj as any)[f];
      if (v) productLevel.push(...collectUrlsFromUnknown(v));
    }
  };
  // existing arrays kept for backward compatibility
  const topImages = Array.isArray(p?.image_urls) ? p.image_urls : [];
  const srcImages = Array.isArray(src?.image_urls) ? src.image_urls : [];
  collectFrom(p);
  collectFrom(src);

  // 2) Variants
  const variants: AnyObj[] = Array.isArray((src as any)?.variants)
    ? (src as any).variants
    : Array.isArray((p as any)?.variants)
    ? (p as any).variants
    : [];

  const variantImages = variants.flatMap(extractImagesFromVariant);

  const merged = uniqUrls(
    [...(topImages || []), ...(srcImages || []), ...productLevel, ...variantImages].filter(
      isHttpUrl
    )
  );

  return { mergedImages: merged, variants };
};

/** مساعد لإحصاء الصور - للتطوير فقط */
export const logImageCounts = (
  productImages: string[],
  variants: AnyObj[],
  where: string
) => {
  const variantImgs = variants.flatMap(extractImagesFromVariant);
  const total = uniqUrls([...(productImages || []), ...variantImgs]).length;
  // تسجيل للتطوير فقط
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[${where}] counts => productImages:${productImages?.length || 0}, variantImages:${variantImgs.length}, totalImages:${total}, variants:${variants.length}`
    );
  }
};