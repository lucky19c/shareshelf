import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function UploadResource() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
    course: "",
    subject: "",
  });

  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);

    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      setError("Unable to load categories.");
    } else {
      setCategories(data || []);
    }

    setLoadingCategories(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    setError("");
    setSuccess("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // 20 MB maximum
    const maxSize = 20 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("File size must not exceed 20 MB.");
      e.target.value = "";
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Please enter a resource title.");
      return;
    }

    if (!form.category_id) {
      setError("Please select a category.");
      return;
    }

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setLoading(true);

    try {
      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError("You must be logged in to upload a resource.");
        navigate("/login");
        return;
      }

      // Create a unique file path
      const fileExtension =
        file.name.split(".").pop()?.toLowerCase() || "";

      const safeFileName = file.name
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9._-]/g, "");

      const filePath = `${user.id}/${crypto.randomUUID()}-${safeFileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Save resource information in database
      const { error: databaseError } = await supabase
        .from("resources")
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          category_id: Number(form.category_id),
          course: form.course.trim() || null,
          subject: form.subject.trim() || null,
          file_path: filePath,
          thumbnail_path: null,
          uploaded_by: user.id,
          download_count: 0,
        });

      if (databaseError) {
        // Remove uploaded file if database insertion fails
        await supabase.storage
          .from("resources")
          .remove([filePath]);

        throw databaseError;
      }

      setSuccess("Resource uploaded successfully.");

      setForm({
        title: "",
        description: "",
        category_id: "",
        course: "",
        subject: "",
      });

      setFile(null);

      document.getElementById("resource-file").value = "";

      setTimeout(() => {
        navigate("/hub");
      }, 1500);

    } catch (err) {
      console.error(err);

      setError(
        err.message || "Something went wrong while uploading."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* NAVBAR */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">

          <Link
            to="/hub"
            className="text-lg font-bold tracking-tight text-slate-900"
          >
            ShareShelf
          </Link>

          <Link
            to="/hub"
            className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
          >
            Back to Hub
          </Link>

        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-3xl px-6 py-12 lg:px-8">

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Share Knowledge
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Upload a Resource
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Share useful educational materials with the community.
          </p>
        </div>

        {/* FORM CARD */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >

          {/* ERROR */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm font-medium text-green-600">
                {success}
              </p>
            </div>
          )}

          <div className="space-y-6">

            {/* TITLE */}
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Resource Title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Example: Data Structures Reviewer"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows="5"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe what this resource contains..."
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label
                htmlFor="category_id"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Category
              </label>

              <select
                id="category_id"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                disabled={loadingCategories}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              >
                <option value="">
                  {loadingCategories
                    ? "Loading categories..."
                    : "Select a category"}
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* COURSE + SUBJECT */}
            <div className="grid gap-6 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="course"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Course
                </label>

                <input
                  id="course"
                  name="course"
                  type="text"
                  value={form.course}
                  onChange={handleChange}
                  placeholder="Example: Computer Engineering"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Subject
                </label>

                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Example: Data Structures"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

            </div>

            {/* FILE */}
            <div>

              <label
                htmlFor="resource-file"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Resource File
              </label>

              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-indigo-400">

                <input
                  id="resource-file"
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700"
                />

                <p className="mt-3 text-xs text-slate-500">
                  Maximum file size: 20 MB
                </p>

                {file && (
                  <div className="mt-4 rounded-lg bg-white p-3">
                    <p className="text-sm font-medium text-slate-700">
                      Selected file
                    </p>

                    <p className="mt-1 break-all text-xs text-slate-500">
                      {file.name}
                    </p>
                  </div>
                )}

              </div>

            </div>

          </div>

          {/* BUTTONS */}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">

            <Link
              to="/hub"
              className="rounded-lg border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Uploading..." : "Upload Resource"}
            </button>

          </div>

        </form>

      </main>

    </div>
  );
}

export default UploadResource;