import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setReady(true);
      } else {
        setError(
          "This password reset link is invalid or has expired."
        );
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Your password has been successfully updated."
    );

    setLoading(false);

    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  // Loading / verifying reset link
  if (!ready && !error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">

        {/* NAVBAR */}
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center px-6 lg:px-8">

            <Link
              to="/"
              className="text-lg font-bold tracking-tight text-slate-900"
            >
              ShareShelf
            </Link>

          </div>
        </header>

        {/* LOADING */}
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">

          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Verifying reset link...
            </p>

          </div>

        </main>

      </div>
    );
  }

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
                Reset Password
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Create a new password for your account.
              </p>

            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm leading-6 text-red-600">
                  {error}
                </p>
              </div>
            )}

            {/* SUCCESS */}
            {message && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm leading-6 text-green-700">
                  {message}
                </p>

                <p className="mt-2 text-xs text-green-600">
                  Redirecting you to the login page...
                </p>
              </div>
            )}

            {/* FORM */}
            {ready && !message && (
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >

                {/* NEW PASSWORD */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    New Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Password must be at least 6 characters.
                  </p>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Confirm New Password
                  </label>

                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Updating..."
                    : "Update Password"}
                </button>

              </form>
            )}

            {/* INVALID LINK */}
            {error && !ready && (
              <div className="mt-6">

                <Link
                  to="/forgot-password"
                  className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
                >
                  Request a New Reset Link
                </Link>

              </div>
            )}

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

          {/* FOOTER */}
          <p className="mt-6 text-center text-xs text-slate-400">
            ShareShelf
          </p>

        </div>

      </main>

    </div>
  );
}

export default ResetPassword;