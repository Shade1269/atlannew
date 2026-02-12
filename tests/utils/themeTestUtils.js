import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

export const themeIds = ['default', 'luxury', 'damascus'];

export function parseTokens(themeId) {
  const cssPath = path.join(projectRoot, 'src', 'themes', themeId, 'tokens.css');
  const css = readFileSync(cssPath, 'utf8');
  const tokens = {};
  const regex = /(--[a-z0-9-]+):\s*([^;]+);/gi;
  let match;
  while ((match = regex.exec(css))) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

export const themeTokens = themeIds.reduce((acc, themeId) => {
  acc[themeId] = parseTokens(themeId);
  return acc;
}, {});

export class FakeDocumentElement {
  constructor(initialTheme = 'default') {
    this.attributes = new Map();
    this.styleVars = { ...(themeTokens[initialTheme] ?? {}) };
    this.style = {
      setProperty: (name, value) => {
        this.styleVars[name] = value;
      },
    };
    this.setAttribute('data-theme', initialTheme);
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
    if (name === 'data-theme') {
      const nextTokens = themeTokens[value];
      if (nextTokens) {
        this.styleVars = { ...nextTokens };
      }
    }
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === 'data-theme') {
      this.styleVars = {};
    }
  }
}

export function installThemeDomMocks(defaultTheme = 'default') {
  const originalDocument = globalThis.document;
  const originalGetComputedStyle = globalThis.getComputedStyle;
  const root = new FakeDocumentElement(defaultTheme);

  globalThis.document = { documentElement: root };
  globalThis.getComputedStyle = (element) => ({
    getPropertyValue: (name) => element.styleVars[name] ?? '',
  });

  const cleanup = () => {
    if (originalDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = originalDocument;
    }

    if (originalGetComputedStyle === undefined) {
      delete globalThis.getComputedStyle;
    } else {
      globalThis.getComputedStyle = originalGetComputedStyle;
    }
  };

  return { root, cleanup };
}

export function pickTokenSnapshot(tokens, keys) {
  const snapshot = {};
  for (const key of keys) {
    snapshot[key] = tokens[key] ?? '';
  }
  return snapshot;
}
