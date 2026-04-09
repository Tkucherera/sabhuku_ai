export async function registerUser({
  email,
  password1,
  password2,
}: {
  email: string;
  password1: string;
  password2: string;
}) {
  const res = await fetch("/api/auth/registration/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, email, password1, password2 }),
  });

  if (!res.ok) throw await res.json();
  const data = await res.json();
  return data as { access: string; refresh?: string };
}

export async function loginUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const res = await fetch("/api/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password }),
  });

  if (!res.ok) throw await res.json();
  const data = await res.json();
  return data as { access: string; refresh?: string };
}

export interface ProfileData {
  bio: string;
  location: string;
  title: string;
  twitter: string;
  linkedin: string;
  github: string;
}

export async function getProfile(token: string) {
  const res = await fetch("/api/profile/", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw await res.json();
  return res.json() as Promise<ProfileData & { username: string; email: string; date_joined: string }>;
}

export async function updateProfile(token: string, data: Partial<ProfileData>) {
  const res = await fetch("/api/profile/", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
