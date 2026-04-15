import { emitAuthRedirect, isTokenExpired } from "../auth";

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
  token?: string | null   // <-- pass token here
): Promise<T> {
  if (token && isTokenExpired(token)) {
    emitAuthRedirect();
    throw { message: "Authentication required." };
  }

  const res = await fetch(`${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }), // inject if present
    },
    ...options,
  });

  if (!res.ok) {
    if (res.status === 401 && token) {
      emitAuthRedirect();
    }
    const error = await res.json().catch(() => ({ message: `API error: ${res.status}` }));
    throw error;
  }

  return res.json();
}
