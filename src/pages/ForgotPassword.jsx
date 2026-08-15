import { useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "../lib/supabase";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

    if (error) {
      setError(error.message);
    } else {
      setMessage(
        "If an account exists for this email, a password reset link has been sent."
      );
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* NAVBAR */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">

          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-slate-900"
          >
            ShareShelf
          </Link>

          <Link
            to="/login"
            className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
          >
            Back to Login
          </Link>

        </div>
      </header>

      {/* MAIN */}
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">

        <div className="w-full max-w-md">

          {/* CARD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">

            {/* HEADER */}
            <div className="mb-8">

              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
                Account Recovery
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Forgot Password?
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your email address and we'll send you a link to reset
                your password.
              </p>

            </div>

            {/* SUCCESS MESSAGE */}
            {message && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm leading-6 text-green-700">
                  {message}
                </p>
              </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm leading-6 text-red-600">
                  {error}
                </p>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

            </form>

            {/* LOGIN LINK */}
            <div className="mt-8 border-t border-slate-100 pt-6 text-center">

              <p className="text-sm text-slate-500">
                Remember your password?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-indigo-600 transition hover:text-indigo-700"
                >
                  Back to Login
                </Link>
              </p>

            </div>

          </div>

          {/* FOOTER TEXT */}
          <p className="mt-6 text-center text-xs text-slate-400">
            ShareShelf
          </p>

        </div>

      </main>

    </div>
  );
}

export default ForgotPassword;