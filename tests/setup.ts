import '@testing-library/jest-dom/vitest'

/**
 * Node >= 22 ships a `localStorage` global that is undefined unless the process
 * was started with `--localstorage-file`. Vitest's jsdom environment only copies
 * globals that don't already exist, so that unusable stub shadows jsdom's real
 * Storage and app code sees no storage at all. Install a working one instead.
 *
 * Written by hand rather than borrowed from jsdom because in Vitest's jsdom
 * environment `window` *is* `globalThis`, so there is no reachable original.
 */
function createMemoryStorage(): Storage {
  const entries = new Map<string, string>()
  return {
    get length() {
      return entries.size
    },
    clear() {
      entries.clear()
    },
    getItem(key: string) {
      return entries.get(String(key)) ?? null
    },
    key(index: number) {
      return Array.from(entries.keys())[index] ?? null
    },
    removeItem(key: string) {
      entries.delete(String(key))
    },
    setItem(key: string, value: string) {
      entries.set(String(key), String(value))
    },
  }
}

// Inspect the descriptor rather than reading the global: touching Node's getter
// is what prints the ExperimentalWarning on every test file.
const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
const isNodeAccessorStub = typeof storageDescriptor?.get === 'function'

if (!storageDescriptor || isNodeAccessorStub) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true,
    writable: true,
  })
}

// jsdom has no 2D canvas and logs a "Not implemented" line on every getContext
// call. StarfieldCanvas already degrades gracefully on a null context, and
// HeroSection.test asserts exactly that path, so mirror it globally.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null as never
}

/**
 * jsdom ships no `matchMedia`, and `src/lib/gsap.ts` registers ScrollTrigger at
 * import time — before any per-suite stub runs. Provide a quiet default that
 * matches nothing, so merely importing GSAP cannot crash a suite. Tests that
 * care about a specific query still install their own stub in `beforeEach`.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  })
}

