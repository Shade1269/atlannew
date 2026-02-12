import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

test("storefront header exposes checkout call-to-action when cart has items", async () => {
  ensureLocalStorage();
  const { default: ThemeProvider } = await import("@/components/ThemeProvider");
  const { default: StorefrontPage } = await import("@/pages/public-storefront/StorefrontPage");

  let addToCartCalled = false;
  const hookOverride = {
    store: { display_name: "عالم العطور", owner_name: "شهد" },
    products: [
      {
        product_id: "p-77",
        products: {
          id: "p-77",
          title: "زيت شعر مغذي",
          price_sar: 160,
          image_urls: [],
        },
      },
    ],
    addToCart: () => {
      addToCartCalled = true;
    },
    totalItems: 2,
    totalAmount: 320,
    storeLoading: false,
    productsLoading: false,
  };

  const queryClient = new QueryClient();

  const element = React.createElement(StorefrontPage, {
    slugOverride: "perfume-world",
    hookOverride,
    settingsOverride: { storeName: "عالم العطور", useThemeHero: false },
  });

  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/perfume-world"] },
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          ThemeProvider,
          { defaultThemeId: "damascus" },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, { path: "/:slug", element })
          )
        )
      )
    )
  );

  assert.match(markup, /data-action="go-to-checkout"/);
  assert.match(markup, /الذهاب للسلة \(2\)/);
  assert.equal(addToCartCalled, false, "server rendering should not trigger addToCart side effects");
});
