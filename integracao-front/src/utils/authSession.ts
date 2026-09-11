const AUTH_COOKIE_KEYS = [
  'authToken',
  'authUsername',
  'authPassword',
  'username',
] as const;

type AuthCookieKey = (typeof AUTH_COOKIE_KEYS)[number];

export interface AuthSession {
  authToken: string;
  authUsername: string;
  authPassword: string;
  username: string;
}

function getCookie(name: string) {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  const value = cookie.slice(name.length + 1);
  return value ? decodeURIComponent(value) : null;
}

function setCookie(name: AuthCookieKey, value: string, days = 7) {
  if (typeof document === 'undefined') {
    return;
  }

  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const secureFlag =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';

  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; expires=${expiresAt.toUTCString()}; path=/; SameSite=Lax${secureFlag}`;
}

function deleteCookie(name: AuthCookieKey) {
  if (typeof document === 'undefined') {
    return;
  }

  const secureFlag =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';

  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${secureFlag}`;
}

function clearLegacyStorage() {
  if (typeof window === 'undefined') {
    return;
  }

  AUTH_COOKIE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

export function clearAuthSession() {
  AUTH_COOKIE_KEYS.forEach((key) => {
    deleteCookie(key);
  });

  clearLegacyStorage();
}

export function setAuthSession(session: AuthSession) {
  AUTH_COOKIE_KEYS.forEach((key) => {
    setCookie(key, session[key]);
  });

  clearLegacyStorage();
}

export function getAuthSession(): AuthSession | null {
  const session = {
    authToken: getCookie('authToken'),
    authUsername: getCookie('authUsername'),
    authPassword: getCookie('authPassword'),
    username: getCookie('username'),
  };

  const values = Object.values(session);
  const hasAllValues = values.every(Boolean);

  if (!hasAllValues) {
    clearAuthSession();
    return null;
  }

  return session as AuthSession;
}

export function requireAuthSession() {
  const session = getAuthSession();

  if (session) {
    return session;
  }

  clearAuthSession();

  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
    window.location.replace('/');
  }

  throw new Error('Sessao expirada. Faca login novamente.');
}
