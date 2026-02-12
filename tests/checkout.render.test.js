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

const noopAsync = async () => {};

const buildCart = () => ({
  id: "cart-1",
  affiliate_store_id: "boutique-1",
  session_id: "session-x",
  items: [
    {
      id: "item-1",
      product_id: "prod-1",
      product_title: "عطر شرقي فاخر",
      product_image_url: "https://cdn.example.com/img1.jpg",
      unit_price_sar: 250,
      quantity: 2,
      total_price_sar: 500,
      shop_id: "shop-1",
    },
    {
      id: "item-2",
      product_id: "prod-2",
      product_title: "شمعة خشبية",
      product_image_url: "https://cdn.example.com/img2.jpg",
      unit_price_sar: 80,
      quantity: 1,
      total_price_sar: 80,
      shop_id: "shop-1",
    },
  ],
});

test("checkout page renders summary, payment options, and items", async () => {
  ensureLocalStorage();
  const { default: ThemeProvider } = await import("@/components/ThemeProvider");
  await import("@/pages/checkout/CheckoutPaymentSection");
  await import("@/pages/checkout/CheckoutSummaryExtras");
  const { default: CheckoutPage } = await import("@/pages/CheckoutPage");

  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/checkout"] },
      React.createElement(
        ThemeProvider,
        { defaultThemeId: "default" },
        React.createElement(CheckoutPage, {
          hookOverride: {
            cart: buildCart(),
            loading: false,
            updateQuantity: noopAsync,
            removeFromCart: noopAsync,
            clearCart: noopAsync,
          },
          fastAuthOverride: {
            profile: { full_name: "ليان" },
          },
        })
      )
    )
  );

  assert.match(markup, /data-testid="checkout-summary"/, "summary card should render");
  assert.match(markup, /data-component="checkout-payment-options"/, "payment options should render");
  assert.match(markup, /data-checkout-items-count/, "items badge should be present");
  assert.match(markup, /عطر شرقي فاخر/, "first item should be listed");
});
