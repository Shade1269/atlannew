import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_STOREFRONT_SETTINGS,
  readStorefrontSettings,
  writeStorefrontSettings,
  clearStorefrontSettings,
} from "@/hooks/useStorefrontSettings";

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

test("storefront settings persist and reset via local storage", () => {
  ensureLocalStorage();
  const slug = "qa-store";

  clearStorefrontSettings(slug);
  assert.equal(readStorefrontSettings(slug), null);

  writeStorefrontSettings(slug, {
    ...DEFAULT_STOREFRONT_SETTINGS,
    storeName: "متجري التجريبي",
    shortDescription: "واجهة عامة لمراجعة الإعدادات",
    accentColor: "var(--primary)",
    useThemeHero: false,
  });

  const saved = readStorefrontSettings(slug);
  assert.ok(saved, "expected saved settings to be returned");
  assert.equal(saved?.storeName, "متجري التجريبي");
  assert.equal(saved?.accentColor, "var(--primary)");
  assert.equal(saved?.useThemeHero, false);

  clearStorefrontSettings(slug);
  assert.equal(readStorefrontSettings(slug), null);
});
