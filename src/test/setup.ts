import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement matchMedia - MUI's useMediaQuery (used by AppShell
// for its desktop/mobile nav split) calls it unconditionally, so without this
// every test that mounts AppShell throws rather than exercising either
// breakpoint. Defaults to "matches: false" (mobile) since that's the safer
// default for a component under test to assume unless a test overrides it.
window.matchMedia =
  window.matchMedia ||
  ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList);
