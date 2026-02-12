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

const cart = {
  id: "cart-a11y",
  affiliate_store_id: "accessible",
  session_id: "session-a11y",
  items: [
    {
      id: "item-a",
      product_id: "prod-a",
      product_title: "حقيبة يد صيفية",
      unit_price_sar: 320,
      quantity: 1,
      total_price_sar: 320,
      shop_id: "shop-a",
    },
  ],
};

test("checkout surfaces aria-live regions and rolegroups for inputs", async () => {
  ensureLocalStorage();
  const { default: ThemeProvider } = await import("@/components/ThemeProvider");
  const { default: CheckoutPage } = await import("@/pages/CheckoutPage");

  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/checkout"] },
      React.createElement(
        ThemeProvider,
        { defaultThemeId: "damascus" },
        React.createElement(CheckoutPage, {
          hookOverride: {
            cart,
            loading: false,
            updateQuantity: async () => {},
            removeFromCart: async () => {},
            clearCart: async () => {},
          },
        })
      )
    )
  );

  assert.match(markup, /role="radiogroup"/, "shipping or payment radios should expose radiogroup role");
  const liveRegionMatches = markup.match(/aria-live="(polite|assertive)"/g) ?? [];
  assert.ok(liveRegionMatches.length >= 2, "expected at least two aria-live regions");
});
