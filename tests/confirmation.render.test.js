import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

const ensureLocalStorage = () => {
  if (typeof globalThis.localStorage !== "undefined") return;
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
};

const sampleOrder = {
  id: "order-1",
  order_number: "EC-123456",
  customer_name: "ليان",
  customer_phone: "0550000000",
  customer_email: "lean@example.com",
  shipping_address: {
    street: "شارع الملك",
    city: "الرياض",
    district: "حي النخيل",
    postal_code: "12345",
    country: "السعودية",
    notes: "اتصال قبل الوصول",
  },
  subtotal_sar: 580,
  shipping_sar: 25,
  tax_sar: 90,
  total_sar: 695,
  payment_status: "PENDING",
  payment_method: "cod",
  status: "PROCESSING",
  created_at: "2024-07-01T12:00:00Z",
  items: [
    {
      id: "item-1",
      product_title: "عطر شرقي فاخر",
      product_image_url: "https://cdn.example.com/p-1.jpg",
      quantity: 1,
      unit_price_sar: 420,
      total_price_sar: 420,
    },
    {
      id: "item-2",
      product_title: "مجموعة بخور",
      product_image_url: "https://cdn.example.com/p-2.jpg",
      quantity: 2,
      unit_price_sar: 80,
      total_price_sar: 160,
    },
  ],
};

test("order confirmation displays receipt and actions", async () => {
  ensureLocalStorage();
  const { default: ThemeProvider } = await import("@/components/ThemeProvider");
  const { default: ConfirmationPage } = await import("@/pages/OrderConfirmationSimple");

  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/order/confirmation?orderId=order-1"] },
      React.createElement(
        ThemeProvider,
        { defaultThemeId: "default" },
        React.createElement(ConfirmationPage, {
          orderOverride: sampleOrder,
          loadingOverride: false,
        })
      )
    )
  );

  assert.match(markup, /EC-123456/, "order number should appear");
  assert.match(markup, /عطر شرقي فاخر/, "first product listed");
  assert.match(markup, /نسخ رقم الطلب/, "copy button rendered");
  assert.match(markup, /الدفع عند الاستلام/, "payment method label should be present");
});
