import { useState } from "react";
import { Link, useNavigate, useSearchParams, useParams } from "react-router";
import { Lock, Brain } from "lucide-react";

import { confirmPasswordReset } from "../api/authApi";

export function PasswordResetConfirmPage() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const uid = params.uid ?? searchParams.get("uid") ?? "";
  const token = params.token ?? searchParams.get("token") ?? "";
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const passwordsMatch = newPassword1 === newPassword2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await confirmPasswordReset({ uid, token, newPassword1, newPassword2 });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null) {
        const fieldErrors = Object.values(err)
          .flat()
          .filter((value): value is string => typeof value === "string");
        setError(fieldErrors[0] || "Could not reset your password. Try again.");
      } else {
        setError("Could not reset your password. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-3xl overflow-hidden">
        <div className="p-10 sm:p-12">
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center gap-2 mb-4 text-slate-900">
              <Brain className="w-10 h-10 text-blue-600" />
              <span className="text-2xl font-bold">SABHUKU AI</span>
            </Link>
            <h1 className="text-3xl font-semibold text-slate-900">Choose a new password</h1>
            <p className="mt-3 text-sm text-slate-500">
              Paste the reset code from your email if it didn&apos;t arrive automatically.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Password reset complete! Redirecting you to login...
              </div>
            )}

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="new-password"
                  type="password"
                  value={newPassword1}
                  onChange={(e) => setNewPassword1(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-11 py-3 text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="confirm-password"
                  type="password"
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-11 py-3 text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Repeat your password"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !passwordsMatch}
              className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Resetting password..." : "Reset password"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600">
            <p>
              Back to <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
