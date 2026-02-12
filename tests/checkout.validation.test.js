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

const cartWithItems = {
  id: "cart-77",
  affiliate_store_id: "glass-shop",
  session_id: "session-77",
  items: [
    {
      id: "item-hero",
      product_id: "hero",
      product_title: "زيت شعر مغذي",
      product_image_url: "https://cdn.example.com/hero.jpg",
      unit_price_sar: 120,
      quantity: 1,
      total_price_sar: 120,
      shop_id: "shop-hero",
    },
  ],
};

test("checkout disables submission until required fields are filled", async () => {
  ensureLocalStorage();
  const { default: ThemeProvider } = await import("@/components/ThemeProvider");
  const { default: CheckoutPage } = await import("@/pages/CheckoutPage");

  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/checkout"] },
      React.createElement(
        ThemeProvider,
        { defaultThemeId: "luxury" },
        React.createElement(CheckoutPage, {
          hookOverride: {
            cart: cartWithItems,
            loading: false,
            updateQuantity: async () => {},
            removeFromCart: async () => {},
            clearCart: async () => {},
          },
        })
      )
    )
  );

  const submitButtonMatch = markup.match(/data-testid="checkout-submit"[^>]*disabled/);
  assert.ok(submitButtonMatch, "submit button should be disabled while form is incomplete");
  assert.match(markup, /aria-live="polite"/, "totals announcement should use polite aria-live");
});
