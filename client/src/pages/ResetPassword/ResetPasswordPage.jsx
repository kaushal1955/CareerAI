import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { resetPasswordRequest } from "../../services/authService";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPasswordRequest(token, password);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "This reset link is invalid or has expired.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center py-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-soft">
        <h1 className="text-2xl font-semibold text-white">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Choose a new password for your account.
        </p>

        {done ? (
          <p className="mt-6 rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
            Password reset successfully. Redirecting you to log in...
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-1 block text-sm text-slate-300"
                htmlFor="password"
              >
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-brand-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                At least 8 characters.
              </p>
            </div>

            <div>
              <label
                className="mb-1 block text-sm text-slate-300"
                htmlFor="confirmPassword"
              >
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-brand-500"
              />
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link to="/login" className="text-brand-400 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
