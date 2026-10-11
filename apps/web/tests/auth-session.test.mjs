import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthActions, createServerClient, createRefreshAuthRouter } from '@insforge/sdk/ssr';
import { updateSession } from '@insforge/sdk/ssr/middleware';

const user = { id: 'test-user', email: 'test@example.invalid', emailVerified: true };
const jwt = (expires) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: user.id, exp: expires })).toString('base64url')}.signature`;
const accessToken = jwt(Math.floor(Date.now() / 1000) + 3600);
const refreshToken = jwt(Math.floor(Date.now() / 1000) + 86400);
const options = { baseUrl: 'https://auth.example.invalid', anonKey: 'test-anon' };
function store(initial = {}) {
  const values = new Map(Object.entries(initial));
  const settings = new Map();
  return { get: name => values.has(name) ? { value: values.get(name) } : undefined, set: (name, value, config) => { values.set(name, value); settings.set(name, config); }, delete: name => values.delete(name), values, settings };
}

test('SSR login, refresh, server validation, verification, reset and logout', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith('/auth/sessions/current') && init?.method === 'DELETE') return Response.json({ success: true });
    if (url.endsWith('/auth/users/current')) return Response.json({ user });
    if (url.endsWith('/auth/email/verify')) return Response.json({ user, accessToken, refreshToken });
    if (url.includes('reset-password')) return Response.json({ success: true });
    return Response.json({ user, accessToken, refreshToken });
  };
  try {
    const cookies = store();
    const auth = createAuthActions({ ...options, cookies });
    const signedIn = await auth.signInWithPassword({ email: user.email, password: 'test-password' });
    assert.equal(signedIn.error, null);
    assert.equal(cookies.get('insforge_access_token').value, accessToken);
    assert.equal(cookies.get('insforge_refresh_token').value, refreshToken);
    assert.equal(cookies.settings.get('insforge_refresh_token').httpOnly, true);
    assert.equal(cookies.settings.get('insforge_access_token').httpOnly, false);
    assert.equal(signedIn.data.accessToken, undefined);
    assert.equal(signedIn.data.refreshToken, undefined);
    const client = createServerClient({ ...options, cookies });
    await client.auth.getCurrentUser();
    assert.ok(calls.some(c => JSON.stringify(c.init?.headers).includes(accessToken)));
    const incoming = store({ insforge_refresh_token: refreshToken });
    const outgoing = store();
    const refreshed = await updateSession({ ...options, requestCookies: incoming, responseCookies: outgoing });
    assert.equal(refreshed.refreshed, true);
    assert.equal(incoming.get('insforge_access_token').value, accessToken);
    assert.equal(outgoing.get('insforge_access_token').value, accessToken);
    assert.equal(outgoing.settings.get('insforge_refresh_token').httpOnly, true);
    const response = await createRefreshAuthRouter(options).POST(new Request('https://app.example.invalid/api/auth/refresh', { method: 'POST', headers: { cookie: `insforge_refresh_token=${refreshToken}` } }));
    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
    const body = await response.json();
    assert.equal(body.refreshToken, undefined);
    await auth.verifyEmail({ email: user.email, otp: '123456' });
    assert.equal(cookies.get('insforge_refresh_token').value, refreshToken);
    await client.auth.resetPassword({ newPassword: 'new-password', otp: 'reset-token' });
    assert.ok(calls.some(c => c.init?.body?.includes('reset-token')));
    await auth.signOut();
    assert.equal(cookies.get('insforge_refresh_token')?.value ?? '', '');
    globalThis.fetch = async () => Response.json({ error: 'UNAUTHORIZED', message: 'Expired' }, { status: 401 });
    const expired = store({ insforge_refresh_token: refreshToken });
    const cleared = store();
    const failed = await updateSession({ ...options, requestCookies: expired, responseCookies: cleared });
    assert.equal(failed.accessToken, null);
    assert.equal(expired.get('insforge_refresh_token')?.value ?? '', '');
  } finally { globalThis.fetch = originalFetch; }
});


test('remember preference survives login and both refresh paths', async () => {
  const { readFile } = await import('node:fs/promises');
  const { default: ts } = await import('typescript');
  const source = await readFile('src/features/auth/session-preference.ts', 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const { sessionCookieSettings, isPersistentSession, sessionPreferenceOptions } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ user, accessToken, refreshToken });
  try {
    for (const persistent of [false, true]) {
      const settings = sessionCookieSettings(persistent);
      const cookies = store();
      await createAuthActions({ ...options, cookies, ...settings }).signInWithPassword({ email: user.email, password: 'test-password' });
      for (const name of ['insforge_access_token', 'insforge_refresh_token']) {
        assert.equal(cookies.settings.get(name).expires instanceof Date, persistent);
        assert.equal(cookies.settings.get(name).maxAge, undefined);
      }
      assert.equal(cookies.settings.get('insforge_refresh_token').httpOnly, true);
      const outgoing = store();
      await updateSession({ ...options, ...settings, requestCookies: store({ insforge_refresh_token: refreshToken }), responseCookies: outgoing });
      assert.equal(outgoing.settings.get('insforge_refresh_token').expires instanceof Date, persistent);
      const response = await createRefreshAuthRouter({ ...options, ...settings }).POST(new Request('https://app.example.invalid/api/auth/refresh', { method: 'POST', headers: { cookie: `insforge_refresh_token=${refreshToken}` } }));
      assert.equal(response.status, 200);
      assert.equal(/Expires=/i.test(response.headers.get('set-cookie')), persistent);
      assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
      assert.equal(isPersistentSession(persistent ? 'persistent' : 'session'), persistent);
      assert.equal(Boolean(sessionPreferenceOptions(persistent).maxAge), persistent);
    }
    assert.equal(isPersistentSession(undefined), true);
  } finally { globalThis.fetch = originalFetch; }
});

test('admin access requires both provisioned ID and email; profile roles cannot grant it', async () => {
  const { readFile } = await import('node:fs/promises');
  const { default: ts } = await import('typescript');
  const source = await readFile('src/features/auth/access.ts', 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const { matchesAdmin, landingPage } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
  const configured = { id: 'admin-id', email: 'admin@example.invalid' };
  const admin = { id: configured.id, email: 'ADMIN@example.invalid' };
  assert.equal(matchesAdmin(admin, configured), true);
  assert.equal(landingPage(admin, configured), '/admin');
  for (const user of [
    { id: 'regular-user', email: configured.email, profile: { role: 'admin', isAdmin: true } },
    { id: configured.id, email: 'different@example.invalid' },
    { id: 'regular-user', email: 'user@example.invalid' },
  ]) {
    assert.equal(matchesAdmin(user, configured), false);
    assert.equal(landingPage(user, configured), '/dashboard');
  }
  assert.equal(matchesAdmin(null, configured), false);
  assert.equal(matchesAdmin(admin, {}), false);
  assert.equal(matchesAdmin(admin, { id: configured.id }), false);
  assert.equal(matchesAdmin(admin, { email: configured.email }), false);
  assert.equal(landingPage(admin, {}), '/dashboard');
});
