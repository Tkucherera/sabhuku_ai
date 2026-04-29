export const AUTH_REDIRECT_EVENT = "app:auth-redirect";
export const AUTH_TOKEN_UPDATED_EVENT = "app:auth-token-updated";

type JwtPayload = {
  exp?: number;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = atob(normalizedPayload);
    return JSON.parse(decodedPayload) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null | undefined) {
  if (!token) {
    return true;
  }

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
}

export function getTokenExpiryMs(token: string | null | undefined) {
  const payload = token ? decodeJwtPayload(token) : null;
  return payload?.exp ? payload.exp * 1000 : null;
}

export function isTokenExpiringSoon(token: string | null | undefined, withinMs = 5 * 60 * 1000) {
  const expiry = getTokenExpiryMs(token);
  return expiry != null && expiry - Date.now() <= withinMs;
}

export function getStoredRefreshToken() {
  return localStorage.getItem("refreshToken");
}

export function storeAuthTokens(accessToken: string, refreshToken?: string | null) {
  localStorage.setItem("token", accessToken);
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
  window.dispatchEvent(new CustomEvent(AUTH_TOKEN_UPDATED_EVENT, { detail: { token: accessToken } }));
}

export function clearStoredToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
}

export function emitAuthRedirect() {
  clearStoredToken();
  window.dispatchEvent(new CustomEvent(AUTH_REDIRECT_EVENT));
}
