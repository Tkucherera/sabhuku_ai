import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { Brain } from "lucide-react";

import {
  exchangeSocialAuthCode,
  getSocialCallbackUrl,
  SocialAuthProvider,
  validateSocialAuthState,
} from "../socialAuth";
import { useAuth } from "./AuthContext";

function isSocialProvider(value: string | undefined): value is SocialAuthProvider {
  return value === "google" || value === "github";
}

export function SocialAuthCallbackPage() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSocialProvider(provider)) {
      setError("Unsupported sign-in provider.");
      return;
    }

    const code = searchParams.get("code");
    const returnedState = searchParams.get("state");
    const providerError = searchParams.get("error");

    if (providerError) {
      setError("Social sign-in was cancelled.");
      return;
    }

    if (!code) {
      setError("Missing social sign-in code.");
      return;
    }

    const redirectTo = validateSocialAuthState(provider, returnedState);
    if (!redirectTo) {
      setError("Could not verify the social sign-in request.");
      return;
    }

    exchangeSocialAuthCode(provider, code, getSocialCallbackUrl(provider))
      .then((data) => {
        login(data.access, data.refresh);
        navigate(redirectTo, { replace: true });
      })
      .catch((error: unknown) => {
        if (typeof error === "object" && error !== null) {
          const fieldErrors = Object.values(error)
            .flat()
            .filter((value): value is string => typeof value === "string");
          setError(fieldErrors[0] || "Social sign-in failed.");
        } else {
          setError("Social sign-in failed.");
        }
      });
  }, [login, navigate, provider, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <Brain className="w-10 h-10 text-blue-600" />
          <span className="font-bold text-2xl">SABHUKU AI</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {error ? "Sign-in failed" : "Signing you in"}
        </h1>
        <p className="text-gray-600">
          {error || "Finishing the secure social sign-in flow."}
        </p>
        {error && (
          <Link to="/login" className="inline-flex mt-6 text-blue-600 hover:text-blue-700 font-medium">
            Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
