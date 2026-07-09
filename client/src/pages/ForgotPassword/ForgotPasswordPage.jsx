import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordRequest } from "../../services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("sending");
    try {
      const data = await forgotPasswordRequest(email.trim());
      setDevResetUrl(data.devResetUrl || "");
      setStatus("sent");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
      setStatus("idle");
    }
  };

  return (
    <div className="flex justify-center py-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-soft">
        <h1 className="text-2xl font-semibold text-white">
          Forgot your password?
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter your account email and we'll send you a link to reset it.
        </p>

        {status === "sent" ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
              If an account exists for that email, a reset link has been sent.
              Check your inbox.
            </p>
            {devResetUrl ? (
              <p className="rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-xs text-amber-300">
                Email isn't configured on this server, so here's the link
                directly (dev only):
                <br />
                <a href={devResetUrl} className="break-all underline">
                  {devResetUrl}
                </a>
              </p>
            ) : null}
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-1 block text-sm text-slate-300"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-brand-500"
              />
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <button
              type="submit"
              disabled={status === "sending"}
              className="btn-primary w-full"
            >
              {status === "sending" ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Remembered your password?{" "}
          <Link to="/login" className="text-brand-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
