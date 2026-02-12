#!/bin/bash

# اختبار create-awb مع بيانات حقيقية
# استبدل القيم التالية بالقيم الحقيقية من حسابك في Bolesa

API_KEY="YOUR_REAL_API_KEY"  # استبدل بـ API Key الحقيقي من .env
STORE_UID="3-bd8y677e-1545-3"  # store_uid من قاعدة البيانات
VENDOR_ID=50  # vendor_id من قاعدة البيانات

echo "🧪 Testing Bolesa create-awb API..."
echo "📍 Endpoint: https://app.bolesa.net/api/integrations/create-awb/shiplink/${STORE_UID}/"
echo "🔑 API Key: ${API_KEY:0:20}..."
echo "🏪 Vendor ID: ${VENDOR_ID}"
echo ""

curl --location "https://app.bolesa.net/api/integrations/create-awb/shiplink/${STORE_UID}/" \
--header "x-api-key: ${API_KEY}" \
--header 'Content-Type: application/json' \
--data "{
  \"order\": {
    \"id\": $(date +%s),
    \"status\": \"success\",
    \"tracking_number\": \"TEST-$(date +%s)\",
    \"payment_method\": \"cod\",
    \"shipment_direction\": \"shipment\",
    \"carrier_strategy\": \"lowest_price\",
    \"shipments\": [
      {
        \"vendor_id\": ${VENDOR_ID},
        \"type\": \"company\",
        \"name\": \"متجر تجريبي\",
        \"phone\": \"0500000000\",
        \"email\": null,
        \"total_items_price\": 100,
        \"total_items_weight\": 1,
        \"shipping_type\": \"regular\",
        \"carrier\": \"smsa\",
        \"cod_amount\": 100,
        \"items\": [
          {
            \"id\": 1,
            \"quantity\": 1,
            \"unit_price\": 100,
            \"total_price\": 100,
            \"name\": \"منتج تجريبي\",
            \"description\": \"اختبار\",
            \"weight\": {
              \"value\": 1,
              \"unit\": \"kg\"
            },
            \"dimensions\": {
              \"length\": 10,
              \"width\": 10,
              \"height\": 10
            }
          }
        ],
        \"address\": {
          \"country_code\": \"SA\",
          \"city_id\": 824,
          \"address_line\": \"الرياض\",
          \"postal_code\": \"12345\"
        }
      }
    ],
    \"consignee\": {
      \"name\": \"عميل تجريبي\",
      \"phone\": \"0501234567\",
      \"email\": \"test@test.com\",
      \"address\": {
        \"country_code\": \"SA\",
        \"city_id\": 864,
        \"address_line\": \"جدة\",
        \"postal_code\": \"12345\"
      }
    }
  }
}" | jq .

echo ""
echo "✅ Done!"
