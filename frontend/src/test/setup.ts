import '@testing-library/jest-dom/vitest';

// Ensure a stable localStorage implementation in Vitest + jsdom.
const localStorageStore = new Map<string, string>();

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => localStorageStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      localStorageStore.set(key, String(value));
    },
    removeItem: (key: string) => {
      localStorageStore.delete(key);
    },
    clear: () => {
      localStorageStore.clear();
    },
  },
  configurable: true,
});
