import { emitAuthRedirect, getStoredRefreshToken, isTokenExpired, storeAuthTokens } from "../auth";

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();

  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/auth/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(refreshToken ? { refresh: refreshToken } : {}),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json() as { access?: string; refresh?: string };
        if (!data.access) return null;
        storeAuthTokens(data.access, data.refresh ?? refreshToken);
        return data.access;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
  token?: string | null   // <-- pass token here
): Promise<T> {
  let activeToken = token;

  if (activeToken && isTokenExpired(activeToken)) {
    activeToken = await refreshAccessToken();
    if (!activeToken) {
      emitAuthRedirect();
      throw { message: "Authentication required." };
    }
  }

  let res = await fetch(`${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(activeToken && { Authorization: `Bearer ${activeToken}` }), // inject if present
    },
    credentials: "same-origin",
    ...options,
  });

  if (res.status === 401 && activeToken) {
    activeToken = await refreshAccessToken();
    if (activeToken) {
      res = await fetch(`${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        credentials: "same-origin",
        ...options,
      });
    }
  }

  if (!res.ok) {
    if (res.status === 401 && activeToken) {
      emitAuthRedirect();
    }
    const error = await res.json().catch(() => ({ message: `API error: ${res.status}` }));
    throw error;
  }

  return res.json();
}
