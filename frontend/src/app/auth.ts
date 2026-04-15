export const AUTH_REDIRECT_EVENT = "app:auth-redirect";

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

export function clearStoredToken() {
  localStorage.removeItem("token");
}

export function emitAuthRedirect() {
  clearStoredToken();
  window.dispatchEvent(new CustomEvent(AUTH_REDIRECT_EVENT));
}
