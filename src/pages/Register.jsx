import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    displayName: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    // Basic username validation
    if (form.username.length < 3) {
      setError("Username must be at least 3 characters.");
      setLoading(false);
      return;
    }

    // Password validation
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,

      options: {
        data: {
          username: form.username,
          display_name: form.displayName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      setSuccess("Account created successfully!");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
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
            Login
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
                ShareShelf
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Create an Account
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Join the community and start sharing useful resources.
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
            {success && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm leading-6 text-green-700">
                  {success}
                </p>
              </div>
            )}

            {/* FORM */}
            <form
              onSubmit={handleRegister}
              className="space-y-5"
            >

              {/* USERNAME */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Username
                </label>

                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Choose a username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Username must be at least 3 characters.
                </p>
              </div>

              {/* DISPLAY NAME */}
              <div>
                <label
                  htmlFor="displayName"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Display Name
                </label>

                <input
                  id="displayName"
                  type="text"
                  name="displayName"
                  placeholder="Enter your display name"
                  value={form.displayName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

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
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Password must be at least 6 characters.
                </p>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
              </button>

            </form>

            {/* LOGIN */}
            <div className="mt-8 border-t border-slate-100 pt-6 text-center">

              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-indigo-600 transition hover:text-indigo-700"
                >
                  Login
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

export default Register;