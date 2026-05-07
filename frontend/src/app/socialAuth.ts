export type SocialAuthProvider = "google" | "github";

type SocialProviderConfig = {
  authorizeUrl: string;
  clientId?: string;
  scope: string;
};

const SOCIAL_AUTH_STATE_KEY = "socialAuthState";

const providerConfigs: Record<SocialAuthProvider, SocialProviderConfig> = {
  google: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    clientId: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID,
    scope: "openid email profile",
  },
  github: {
    authorizeUrl: "https://github.com/login/oauth/authorize",
    clientId: import.meta.env.VITE_GITHUB_OAUTH_CLIENT_ID,
    scope: "read:user user:email",
  },
};

export function getSocialCallbackUrl(provider: SocialAuthProvider) {
  return `${window.location.origin}/auth/social/${provider}/callback`;
}

function randomState() {
  const bytes = new Uint8Array(24);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function beginSocialAuth(provider: SocialAuthProvider, redirectTo: string) {
  const config = providerConfigs[provider];
  if (!config.clientId) {
    throw new Error(`Missing ${provider} OAuth client ID.`);
  }

  const state = randomState();
  sessionStorage.setItem(
    SOCIAL_AUTH_STATE_KEY,
    JSON.stringify({ provider, redirectTo, state })
  );

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: getSocialCallbackUrl(provider),
    response_type: "code",
    scope: config.scope,
    state,
  });

  if (provider === "google") {
    params.set("access_type", "offline");
    params.set("prompt", "select_account");
  }

  window.location.assign(`${config.authorizeUrl}?${params.toString()}`);
}

export function validateSocialAuthState(provider: SocialAuthProvider, returnedState: string | null) {
  const rawState = sessionStorage.getItem(SOCIAL_AUTH_STATE_KEY);
  sessionStorage.removeItem(SOCIAL_AUTH_STATE_KEY);

  if (!rawState || !returnedState) {
    return null;
  }

  try {
    const parsedState = JSON.parse(rawState) as {
      provider?: SocialAuthProvider;
      redirectTo?: string;
      state?: string;
    };

    if (parsedState.provider !== provider || parsedState.state !== returnedState) {
      return null;
    }

    return parsedState.redirectTo || "/dashboard";
  } catch {
    return null;
  }
}

export async function exchangeSocialAuthCode(
  provider: SocialAuthProvider,
  code: string,
  callbackUrl: string
) {
  const res = await fetch(`/api/auth/social/${provider}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ code, callback_url: callbackUrl }),
  });

  if (!res.ok) throw await res.json().catch(() => ({ message: "Social sign-in failed." }));
  return await res.json() as { access: string; refresh?: string };
}
