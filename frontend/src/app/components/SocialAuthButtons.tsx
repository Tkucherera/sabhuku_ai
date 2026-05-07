import { Github, Chrome } from "lucide-react";
import { useState } from "react";

import { beginSocialAuth, SocialAuthProvider } from "../socialAuth";

const providers: Array<{
  id: SocialAuthProvider;
  label: string;
  Icon: typeof Github;
}> = [
  { id: "google", label: "Continue with Google", Icon: Chrome },
  { id: "github", label: "Continue with GitHub", Icon: Github },
];

export function SocialAuthButtons({ redirectTo }: { redirectTo: string }) {
  const [error, setError] = useState<string | null>(null);

  const handleSocialAuth = (provider: SocialAuthProvider) => {
    try {
      setError(null);
      beginSocialAuth(provider, redirectTo);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Social sign-in is not configured.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        {providers.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleSocialAuth(id)}
            className="w-full inline-flex items-center justify-center gap-3 border border-gray-300 bg-white text-gray-800 py-3 rounded-lg hover:bg-gray-50 font-medium"
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}
