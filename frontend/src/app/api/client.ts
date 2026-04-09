//const BASE_URL = import.meta.env.VITE_API_URL || "";

// lib/apiClient.ts
//const BASE_URL = "http://127.0.0.1:8080";

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
  token?: string | null   // <-- pass token here
): Promise<T> {
  const res = await fetch(`${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }), // inject if present
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `API error: ${res.status}` }));
    throw error;
  }

  return res.json();
}