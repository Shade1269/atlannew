#!/usr/bin/env python3
"""
Script لإصلاح CORS في Edge Functions المتبقية
"""

import os
import re

# الـ functions المتبقية التي تحتاج إصلاح
REMAINING_FUNCTIONS = [
    "send-customer-otp",
    "verify-customer-otp",
    "create-customer-otp-session",
    "process-affiliate-order",
    "admin-actions",
    "create-ecommerce-order",
    "fraud-detection",
    "get-store-orders-for-session",
    "update-atlantis-points",
]

def fix_cors_in_file(filepath):
    """إصلاح CORS في ملف واحد"""
    if not os.path.exists(filepath):
        return False, "File not found"

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # تحقق إذا كان تم إصلاحه بالفعل
    if "from '../_shared/cors.ts'" in content:
        return False, "Already fixed"

    original_content = content

    # Pattern 1: إضافة import و حذف corsHeaders القديم
    # البحث عن آخر import statement
    import_pattern = r"(import.*?;\n)"
    imports = re.findall(import_pattern, content)

    if imports:
        last_import = imports[-1]
        # إضافة import للـ CORS helpers بعد آخر import
        new_import = last_import + "import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';\n"
        content = content.replace(last_import, new_import, 1)

    # حذف تعريف corsHeaders القديم
    cors_def_pattern = r"\nconst corsHeaders = \{[^}]+\};\n"
    content = re.sub(cors_def_pattern, "\n", content)

    # Pattern 2: استبدال OPTIONS handler
    options_pattern = r"(serve\(async \(req\) => \{\n  if \(req\.method === 'OPTIONS'\) \{\n    return new Response\(null, \{ headers: corsHeaders \}\);\n  \}\n\n  try \{)"

    replacement = """serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {"""

    content = re.sub(options_pattern, replacement, content)

    # إذا لم يتم العثور على النمط الأول، جرّب نمط آخر
    if content == original_content or "getCorsHeaders(req)" not in content:
        # نمط بديل
        alt_pattern = r"serve\(async \(req\) => \{\n  if \(req\.method === 'OPTIONS'\) \{\n    return new Response\(null, \{ headers: corsHeaders \}\);\n  \}"
        alt_replacement = """serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);"""
        content = re.sub(alt_pattern, alt_replacement, content)

    if content == original_content:
        return False, "No changes made"

    # حفظ الملف
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    return True, "Fixed successfully"

def main():
    base_path = "supabase/functions"
    fixed_count = 0

    print("🔧 إصلاح CORS في Edge Functions المتبقية...\n")

    for func_name in REMAINING_FUNCTIONS:
        filepath = os.path.join(base_path, func_name, "index.ts")
        success, message = fix_cors_in_file(filepath)

        if success:
            print(f"✅ {func_name} - {message}")
            fixed_count += 1
        else:
            print(f"ℹ️  {func_name} - {message}")

    print(f"\n✅ انتهى! تم إصلاح {fixed_count} من أصل {len(REMAINING_FUNCTIONS)} functions")

if __name__ == "__main__":
    main()
