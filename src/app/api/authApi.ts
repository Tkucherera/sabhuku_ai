

export async function registerUser({
  name,
  email,
  password1,
  password2,
}: {
  name: string;
  email: string;
  password1: string;
  password2: string
}) {
  const res = await fetch("http://127.0.0.1:8000/api/auth/registration/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: name,
      email,
      password1,
      password2,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw error;
  }

  return res.json();
}


// api/AuthApi.ts
export async function loginUser({  username, password,  }: { username: string; password: string;  }) {
  const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw await res.json();

  const data = await res.json();
  return data as { access: string; refresh?: string }; // match your backend shape
}

