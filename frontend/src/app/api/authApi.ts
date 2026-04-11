export async function registerUser({
  firstName,
  lastName,
  publicUsername,
  email,
  password1,
  password2,
}: {
  firstName: string;
  lastName: string;
  publicUsername: string;
  email: string;
  password1: string;
  password2: string;
}) {
  const res = await fetch("/api/auth/registration/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: email,
      email,
      first_name: firstName,
      last_name: lastName,
      public_username: publicUsername,
      password1,
      password2,
    }),
  });

  if (!res.ok) throw await res.json();
  const data = await res.json();
  return data as { access: string; refresh?: string };
}

export async function loginUser({
  identifier,
  password,
}: {
  identifier: string;
  password: string;
}) {
  const res = await fetch("/api/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: identifier, password }),
  });

  if (!res.ok) throw await res.json();
  const data = await res.json();
  return data as { access: string; refresh?: string };
}

export async function requestPasswordReset({
  email,
}: {
  email: string;
}) {
  const res = await fetch("/api/auth/password/reset/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) throw await res.json();
  return res.json();
}

export async function confirmPasswordReset({
  uid,
  token,
  newPassword1,
  newPassword2,
}: {
  uid: string;
  token: string;
  newPassword1: string;
  newPassword2: string;
}) {
  const res = await fetch("/api/auth/password/reset/confirm/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, token, new_password1: newPassword1, new_password2: newPassword2 }),
  });

  if (!res.ok) throw await res.json();
  return res.json();
}

export interface ProfileData {
  public_username: string;
  first_name: string;
  last_name: string;
  bio: string;
  location: string;
  title: string;
  avatar_path?: string;
  avatar_url: string;
  cover_image_path?: string;
  cover_image_url: string;
  twitter: string;
  linkedin: string;
  github: string;
}

interface SignedUploadResponse {
  upload_url: string;
  file_path: string;
  file_url: string;
  content_type: string;
  expires_in_minutes: number;
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

export async function requestProfileImageUploadUrl(
  token: string,
  filename: string,
  contentType: string
) {
  const res = await fetch("/api/profile/upload-url/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename,
      content_type: contentType || "application/octet-stream",
    }),
  });

  if (!res.ok) throw await res.json();
  return res.json() as Promise<SignedUploadResponse>;
}

export async function uploadProfileImageToStorage(
  uploadUrl: string,
  file: File,
  contentType: string
) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image to storage");
  }
}
