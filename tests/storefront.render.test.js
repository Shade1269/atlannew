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

test("public storefront renders hero, header, and products when data is provided", async () => {
  ensureLocalStorage();
  const { default: ThemeProvider } = await import("@/components/ThemeProvider");
  const { default: StorefrontPage } = await import("@/pages/public-storefront/StorefrontPage");

  const hookOverride = {
    store: {
      display_name: "بوتيك الأناقة",
      owner_name: "ليان",
      short_description: "إطلالات أنيقة يومية",
    },
    products: [
      {
        product_id: "p-100",
        products: {
          id: "p-100",
          title: "عطر شرقي فاخر",
          price_sar: 420,
          image_urls: ["https://cdn.example.com/p-100.jpg"],
          description: "مزيج دافئ من العنبر والزهور",
        },
      },
    ],
    addToCart: () => {},
    storeLoading: false,
    productsLoading: false,
  };

  const queryClient = new QueryClient();

  const element = React.createElement(StorefrontPage, {
    slugOverride: "style-boutique",
    hookOverride,
    settingsOverride: {
      storeName: "بوتيك الأناقة",
      shortDescription: "تسوقي أفضل المنتجات العطرية",
      useThemeHero: false,
    },
  });

  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/style-boutique"] },
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          ThemeProvider,
          { defaultThemeId: "luxury" },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, { path: "/:slug", element })
          )
        )
      )
    )
  );

  assert.match(markup, /data-section="storefront-header"/);
  assert.match(markup, /بوتيك الأناقة/);
  assert.match(markup, /data-section="products-grid"/);
  assert.match(markup, /data-testid="hero-cta"/);
});

test("public storefront shows skeleton loaders while data is loading", async () => {
  ensureLocalStorage();
  const { default: ThemeProvider } = await import("@/components/ThemeProvider");
  const { default: StorefrontPage } = await import("@/pages/public-storefront/StorefrontPage");

  const hookOverride = {
    store: null,
    products: [],
    addToCart: () => {},
    storeLoading: true,
    productsLoading: true,
  };

  const queryClient = new QueryClient();

  const element = React.createElement(StorefrontPage, {
    slugOverride: "loading-shop",
    hookOverride,
    settingsOverride: {
      storeName: "متجر قيد التحميل",
      useThemeHero: false,
    },
  });

  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/loading-shop"] },
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          ThemeProvider,
          { defaultThemeId: "default" },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, { path: "/:slug", element })
          )
        )
      )
    )
  );

  const skeletonMatches = markup.match(/data-skeleton="product-card"/g) ?? [];
  assert.ok(skeletonMatches.length >= 1, "expected skeleton loaders when data is loading");
});
