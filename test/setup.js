// Vitest setup file - runs before all tests
import { vi } from 'vitest';

// Mock window.matchMedia for jsdom environment
window.matchMedia = vi.fn(() => ({
  matches: false,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
