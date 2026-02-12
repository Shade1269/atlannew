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

const sanitize = (html) => html.replace(/\s+/g, " ").trim().slice(0, 900);
const expectedPrefix = '<div dir="rtl" class="min-h-screen bg-[color:var(--bg)] text-[color:var(--fg)]" data-storefront-root="true">';

const themes = ["default", "luxury", "damascus"];

test("public storefront glass shell stays consistent across themes", async () => {
  ensureLocalStorage();
  const { default: ThemeProvider } = await import("@/components/ThemeProvider");
  const { default: StorefrontPage } = await import("@/pages/public-storefront/StorefrontPage");

  const hookOverride = {
    store: { display_name: "متجر الزجاج", owner_name: "جود" },
    products: [
      {
        product_id: "p-1",
        products: { id: "p-1", title: "منتج تجريبي", price_sar: 200, image_urls: [] },
      },
    ],
    addToCart: () => {},
    storeLoading: false,
    productsLoading: false,
  };

  const snapshots = {};

  for (const themeId of themes) {
    const queryClient = new QueryClient();
    const element = React.createElement(StorefrontPage, {
      slugOverride: "glass-shop",
      hookOverride,
      settingsOverride: {
        storeName: "متجر الزجاج",
        shortDescription: "واجهة عامة بتصميم زجاجي",
        useThemeHero: false,
      },
    });

    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/glass-shop"] },
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(
            ThemeProvider,
            { defaultThemeId: themeId },
            React.createElement(
              Routes,
              null,
              React.createElement(Route, { path: "/:slug", element })
            )
          )
        )
      )
    );

    const sanitized = sanitize(markup);
    assert.ok(sanitized.startsWith(expectedPrefix), `markup should start with glass shell prefix for theme ${themeId}`);
    assert.match(markup, /data-section="storefront-header"/);
    assert.match(markup, /href="\/checkout"/);
    snapshots[themeId] = sanitized;
  }

  assert.equal(Object.keys(snapshots).length, themes.length);
});
