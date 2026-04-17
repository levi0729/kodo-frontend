import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock sessionStorage
const mockStorage = {};
vi.stubGlobal('sessionStorage', {
  getItem: vi.fn((key) => mockStorage[key] || null),
  setItem: vi.fn((key, val) => { mockStorage[key] = val; }),
  removeItem: vi.fn((key) => { delete mockStorage[key]; }),
});

// Must import after sessionStorage is stubbed
const { setToken, getToken, healthCheck, auth } = await import('@/services/api');

describe('Token management', () => {
  beforeEach(() => {
    setToken(null);
    vi.clearAllMocks();
  });

  it('setToken stores token and persists to sessionStorage', () => {
    setToken('abc123');
    expect(getToken()).toBe('abc123');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('kodo_token', 'abc123');
  });

  it('setToken(null) clears token and sessionStorage', () => {
    setToken('abc123');
    setToken(null);
    expect(getToken()).toBeNull();
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('kodo_token');
  });

  it('getToken returns current token', () => {
    setToken('token-xyz');
    expect(getToken()).toBe('token-xyz');
  });
});

describe('healthCheck', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when API responds with ok', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      })
    ));

    const result = await healthCheck();
    expect(result).toBe(true);
  });

  it('returns false when API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));

    const result = await healthCheck();
    expect(result).toBe(false);
  });
});

describe('request error handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setToken(null);
  });

  it('throws on 401 and clears auth state', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        status: 401,
        ok: false,
        json: () => Promise.resolve({ message: 'Unauthenticated.' }),
      })
    ));

    // Set a token so we can verify it gets cleared
    setToken('expired-token');

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    await expect(auth.me()).rejects.toThrow('Session expired');
    expect(getToken()).toBeNull();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
  });

  it('throws with error message from API response', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        status: 422,
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'Validation failed', code: 'VALIDATION_ERROR' },
        }),
      })
    ));

    await expect(auth.login('bad@email.com', 'pass')).rejects.toThrow('Validation failed');
  });

  it('throws timeout error on slow requests', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      new Promise((_, reject) => {
        const err = new Error('Aborted');
        err.name = 'AbortError';
        setTimeout(() => reject(err), 50);
      })
    ));

    await expect(auth.me()).rejects.toThrow('timed out');
  });
});

describe('auth namespace', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setToken(null);
  });

  it('login sends correct payload', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          message: 'Verification required.',
          verification_required: true,
          user_id: 1,
        }),
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    const result = await auth.login('test@example.com', 'Password1');
    expect(result.verification_required).toBe(true);

    const [url, config] = mockFetch.mock.calls[0];
    expect(url).toContain('/auth/login');
    expect(config.method).toBe('POST');
    const body = JSON.parse(config.body);
    expect(body.email).toBe('test@example.com');
    expect(body.password).toBe('Password1');
  });
});
