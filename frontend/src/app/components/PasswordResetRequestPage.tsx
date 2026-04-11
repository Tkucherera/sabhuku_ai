import { useState } from "react";
import { Link } from "react-router";
import { Mail, Brain } from "lucide-react";

import { requestPasswordReset } from "../api/authApi";

export function PasswordResetRequestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await requestPasswordReset({ email });
      setSuccess(true);
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null) {
        const fieldErrors = Object.values(err)
          .flat()
          .filter((value): value is string => typeof value === "string");
        setError(fieldErrors[0] || "Could not send reset email. Try again.");
      } else {
        setError("Could not send reset email. Try again.");
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
            <h1 className="text-3xl font-semibold text-slate-900">Reset your password</h1>
            <p className="mt-3 text-sm text-slate-500">
              Enter the email you used to sign up and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Reset instructions sent! Check your inbox and spam folder if it takes a moment.
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-11 py-3 text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Sending reset link..." : "Send reset link"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600">
            <p>
              Remembered your password? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
