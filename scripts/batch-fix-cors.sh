#!/bin/bash

# قائمة الـ Edge Functions التي تحتاج إصلاح CORS
FUNCTIONS=(
  "send-customer-otp"
  "verify-customer-otp"
  "create-customer-otp-session"
  "process-affiliate-order"
  "admin-actions"
  "create-ecommerce-order"
  "fraud-detection"
  "get-store-orders-for-session"
  "update-atlantis-points"
)

echo "🔧 تطبيق secure CORS على ${#FUNCTIONS[@]} functions..."
echo ""

for func in "${#FUNCTIONS[@]}"; do
  FILE="supabase/functions/${func}/index.ts"

  if [ ! -f "$FILE" ]; then
    echo "❌ $func - الملف غير موجود"
    continue
  fi

  # تحقق إذا كان الملف يحتوي على wildcard CORS
  if ! grep -q "Access-Control-Allow-Origin.*\*" "$FILE"; then
    echo "✅ $func - تم إصلاحه مسبقاً"
    continue
  fi

  echo "🔧 $func - جاري الإصلاح..."

  # إنشاء ملف مؤقت
  TMP_FILE="${FILE}.tmp"

  # قراءة الملف سطر بسطر وتطبيق التعديلات
  awk '
  BEGIN { in_cors_block = 0; serve_found = 0 }

  # إضافة import للـ CORS helpers بعد آخر import
  /^import.*from/ {
    print $0
    if (!cors_imported && getline nextline > 0) {
      if (nextline !~ /^import/) {
        print "import { getCorsHeaders, handleCorsPreflightRequest } from '"'"'../_shared/cors.ts'"'"';"
        cors_imported = 1
      }
      print nextline
    }
    next
  }

  # حذف تعريف corsHeaders القديم
  /^const corsHeaders = \{/ { in_cors_block = 1; next }
  in_cors_block == 1 && /^\};/ { in_cors_block = 0; next }
  in_cors_block == 1 { next }

  # استبدال OPTIONS handler
  /if \(req\.method === '"'"'OPTIONS'"'"'\)/ {
    print "  if (req.method === '"'"'OPTIONS'"'"') {"
    getline # تخطي السطر التالي (return)
    print "    return handleCorsPreflightRequest(req);"
    getline # تخطي الـ }
    print "  }"
    print ""
    print "  const corsHeaders = getCorsHeaders(req);"
    next
  }

  { print $0 }
  ' "$FILE" > "$TMP_FILE"

  # استبدال الملف الأصلي
  mv "$TMP_FILE" "$FILE"
  echo "✅ $func - تم الإصلاح بنجاح"
done

echo ""
echo "✅ انتهى تطبيق secure CORS"
