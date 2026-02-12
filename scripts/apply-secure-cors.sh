#!/bin/bash

# قائمة بالـ Edge Functions ذات الأولوية العالية (بيانات حساسة)
HIGH_PRIORITY=(
  "create-geidea-session"
  "process-geidea-callback"
  "geidea-webhook"
  "send-platform-otp"
  "verify-platform-otp"
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

echo "🔒 سيتم تطبيق secure CORS على ${#HIGH_PRIORITY[@]} Edge Functions"
echo ""

for func in "${HIGH_PRIORITY[@]}"; do
  FILE="supabase/functions/${func}/index.ts"

  if [ -f "$FILE" ]; then
    # تحقق إذا كان يستخدم shared CORS بالفعل
    if grep -q "from.*_shared.*cors" "$FILE"; then
      echo "✅ $func - يستخدم secure CORS بالفعل"
    else
      echo "🔧 $func - يحتاج إصلاح"
    fi
  else
    echo "❌ $func - الملف غير موجود"
  fi
done

echo ""
echo "✅ انتهى الفحص"
