import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Profile() {

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [resources, setResources] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  const [form, setForm] = useState({
    username: "",
    display_name: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // DELETE MODAL
  const [deleteModal, setDeleteModal] =
    useState(false);

  const [resourceToDelete, setResourceToDelete] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);


  // =========================================================
  // LOAD PROFILE
  // =========================================================

  useEffect(() => {
    loadProfile();
  }, []);


  const loadProfile = async () => {

    setLoading(true);
    setError("");

    try {

      // -----------------------------------------------------
      // CURRENT USER
      // -----------------------------------------------------

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!currentUser) {

        setError(
          "You must be logged in to view your profile."
        );

        setLoading(false);

        return;
      }

      setUser(currentUser);


      // -----------------------------------------------------
      // PROFILE
      // -----------------------------------------------------

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      setProfile(profileData);

      setForm({
        username:
          profileData.username || "",

        display_name:
          profileData.display_name || "",
      });


      // -----------------------------------------------------
      // USER RESOURCES
      // -----------------------------------------------------

      const {
        data: resourceData,
        error: resourceError,
      } = await supabase
        .from("resources")
        .select(`
          id,
          title,
          description,
          course,
          subject,
          uploaded_by,
          download_count,
          created_at,
          category_id,

          categories (
            id,
            name
          )
        `)
        .eq("uploaded_by", currentUser.id)
        .order("created_at", {
          ascending: false,
        });

      if (resourceError) {
        throw resourceError;
      }

      setResources(resourceData || []);


      // -----------------------------------------------------
      // BOOKMARKS
      // -----------------------------------------------------

      const {
        data: bookmarkData,
        error: bookmarkError,
      } = await supabase
        .from("bookmarks")
        .select(`
          id,
          created_at,
          resource_id,

          resources (
            id,
            title,
            description,
            course,
            subject,
            download_count,
            created_at,

            categories (
              id,
              name
            )
          )
        `)
        .eq("user_id", currentUser.id)
        .order("created_at", {
          ascending: false,
        });

      if (bookmarkError) {
        throw bookmarkError;
      }

      setBookmarks(bookmarkData || []);

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to load profile."
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };


  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSave = async (e) => {

    e.preventDefault();

    setMessage("");
    setError("");

    const username =
      form.username.trim();

    const displayName =
      form.display_name.trim();


    // USERNAME VALIDATION

    if (username.length < 3) {

      setError(
        "Username must be at least 3 characters."
      );

      return;
    }


    if (!/^[a-zA-Z0-9_]+$/.test(username)) {

      setError(
        "Username can only contain letters, numbers, and underscores."
      );

      return;
    }


    // DISPLAY NAME VALIDATION

    if (!displayName) {

      setError(
        "Display name cannot be empty."
      );

      return;
    }


    setSaving(true);

    try {

      // -----------------------------------------------------
      // CHECK USERNAME
      // -----------------------------------------------------

      const {
        data: existingProfile,
        error: usernameCheckError,
      } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("username", username)
        .neq("id", user.id)
        .maybeSingle();

      if (usernameCheckError) {
        throw usernameCheckError;
      }


      if (existingProfile) {

        setError(
          "That username is already taken. Please choose another username."
        );

        setSaving(false);

        return;
      }


      // -----------------------------------------------------
      // UPDATE PROFILE
      // -----------------------------------------------------

      const {
        data,
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          username,
          display_name:
            displayName,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) {

        // Duplicate username fallback
        if (
          updateError.code === "23505"
        ) {

          setError(
            "That username is already taken. Please choose another username."
          );

          setSaving(false);

          return;
        }

        throw updateError;
      }


      setProfile(data);

      setForm({
        username:
          data.username || "",

        display_name:
          data.display_name || "",
      });


      setMessage(
        "Your profile has been updated successfully."
      );

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to update profile."
      );

    } finally {

      setSaving(false);

    }
  };


  // =========================================================
  // OPEN DELETE MODAL
  // =========================================================

  const openDeleteModal = (resource) => {

    setResourceToDelete(resource);
    setDeleteModal(true);

  };


  // =========================================================
  // CLOSE DELETE MODAL
  // =========================================================

  const closeDeleteModal = () => {

    if (deleting) {
      return;
    }

    setDeleteModal(false);
    setResourceToDelete(null);

  };


  // =========================================================
  // DELETE RESOURCE
  // =========================================================

  const handleDeleteResource = async () => {

    if (!resourceToDelete || !user) {
      return;
    }

    setDeleting(true);
    setError("");
    setMessage("");

    try {

      // -----------------------------------------------------
      // OWNERSHIP CHECK
      // -----------------------------------------------------

      if (
        resourceToDelete.uploaded_by !==
        user.id
      ) {

        throw new Error(
          "You can only delete resources that you uploaded."
        );

      }


      // -----------------------------------------------------
      // DELETE RESOURCE
      // -----------------------------------------------------

      const {
        error: deleteError,
      } = await supabase
        .from("resources")
        .delete()
        .eq("id", resourceToDelete.id)
        .eq("uploaded_by", user.id);

      if (deleteError) {
        throw deleteError;
      }


      // -----------------------------------------------------
      // REMOVE FROM UI
      // -----------------------------------------------------

      setResources((current) =>
        current.filter(
          (resource) =>
            resource.id !==
            resourceToDelete.id
        )
      );


      setDeleteModal(false);
      setResourceToDelete(null);


      setMessage(
        `"${resourceToDelete.title}" was deleted successfully.`
      );

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to delete resource."
      );

    } finally {

      setDeleting(false);

    }
  };


  // =========================================================
  // TOTAL DOWNLOADS
  // =========================================================

  const totalDownloads =
    resources.reduce(
      (total, resource) =>
        total +
        (resource.download_count || 0),
      0
    );


  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {

    if (!date) return "";

    return new Date(date).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );

  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <div className="min-h-screen bg-slate-50">

        <header className="border-b border-slate-200 bg-white">

          <div className="mx-auto flex h-16 max-w-7xl items-center px-6 lg:px-8">

            <Link
              to="/hub"
              className="text-lg font-bold tracking-tight text-slate-900"
            >
              ShareShelf
            </Link>

          </div>

        </header>

        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">

          <p className="text-sm text-slate-500">
            Loading profile...
          </p>

        </main>

      </div>

    );
  }


  // =========================================================
  // NO USER
  // =========================================================

  if (!user || !profile) {

    return (

      <div className="min-h-screen bg-slate-50">

        <main className="mx-auto max-w-md px-6 py-20">

          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

            <h1 className="text-xl font-bold text-red-700">
              Profile unavailable
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error ||
                "Please log in first."}
            </p>

            <Link
              to="/login"
              className="mt-6 inline-flex rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Back to Login
            </Link>

          </div>

        </main>

      </div>

    );
  }


  // =========================================================
  // MAIN
  // =========================================================

  return (

    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">

          <Link
            to="/hub"
            className="text-lg font-bold tracking-tight text-slate-900"
          >
            ShareShelf
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium">

            <Link
              to="/hub"
              className="text-slate-600 hover:text-indigo-600"
            >
              Home
            </Link>

            <Link
              to="/profile"
              className="text-indigo-600"
            >
              Profile
            </Link>

            <Link
              to="/upload"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-white hover:bg-indigo-700"
            >
              Upload Resource
            </Link>

          </nav>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">


        {/* =================================================
            PROFILE HEADER
        ================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-10 sm:px-10">

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white/30 bg-white text-3xl font-bold text-indigo-700">

                {(profile.display_name ||
                  profile.username ||
                  "U")
                  .charAt(0)
                  .toUpperCase()}

              </div>


              <div className="text-white">

                <h1 className="text-3xl font-bold">
                  {profile.display_name ||
                    profile.username}
                </h1>

                <p className="mt-1 text-sm text-indigo-100">
                  @{profile.username}
                </p>

                <p className="mt-2 text-sm text-indigo-100">
                  {user.email}
                </p>

              </div>

            </div>

          </div>


          {/* STATS */}

          <div className="grid grid-cols-3 divide-x divide-slate-200">

            <div className="p-6 text-center">

              <p className="text-2xl font-bold">
                {resources.length}
              </p>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Uploaded
              </p>

            </div>

            <div className="p-6 text-center">

              <p className="text-2xl font-bold">
                {bookmarks.length}
              </p>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Saved
              </p>

            </div>

            <div className="p-6 text-center">

              <p className="text-2xl font-bold">
                {totalDownloads}
              </p>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Downloads
              </p>

            </div>

          </div>

        </section>


        {/* =================================================
            ERROR
        ================================================== */}

        {error && (

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="text-sm font-medium text-red-600">
              {error}
            </p>

          </div>

        )}


        {/* =================================================
            SUCCESS
        ================================================== */}

        {message && (

          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">

            <p className="text-sm font-medium text-green-700">
              {message}
            </p>

          </div>

        )}


        {/* =================================================
            PROFILE INFORMATION
        ================================================== */}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

          <div className="mb-6">

            <h2 className="text-xl font-bold">
              Profile Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage the information displayed
              on your profile.
            </p>

          </div>


          <form
            onSubmit={handleSave}
            className="space-y-5"
          >

            {/* DISPLAY NAME */}

            <div>

              <label
                htmlFor="display_name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Display Name
              </label>

              <input
                id="display_name"
                name="display_name"
                type="text"
                value={
                  form.display_name
                }
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

            </div>


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
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                required
                minLength={3}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <p className="mt-2 text-xs text-slate-400">
                Letters, numbers, and underscores only.
              </p>

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
                value={user.email || ""}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
              />

              <p className="mt-2 text-xs text-slate-400">
                Your email address is managed
                by your authentication account.
              </p>

            </div>


            {/* SAVE */}

            <div className="pt-2">

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving Changes..."
                  : "Save Changes"}
              </button>

            </div>

          </form>

        </section>


        {/* =================================================
            MY RESOURCES
        ================================================== */}

        <section className="mt-10">

          <div className="mb-6 flex items-end justify-between">

            <div>

              <h2 className="text-2xl font-bold">
                My Resources
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Resources you have shared with
                the community.
              </p>

            </div>

            <Link
              to="/upload"
              className="hidden rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 sm:inline-flex"
            >
              Upload
            </Link>

          </div>


          {resources.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

              <h3 className="text-lg font-semibold">
                No uploaded resources
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                You haven't shared a resource yet.
              </p>

              <Link
                to="/upload"
                className="mt-5 inline-flex rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Upload Your First Resource
              </Link>

            </div>

          ) : (

            <div className="grid gap-6 md:grid-cols-2">

              {resources.map(
                (resource) => (

                  <article
                    key={resource.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >

                    {/* CATEGORY */}

                    <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {resource.categories?.name ||
                        "Uncategorized"}
                    </span>


                    {/* TITLE */}

                    <h3 className="mt-4 line-clamp-2 text-lg font-bold">
                      {resource.title}
                    </h3>


                    {/* DESCRIPTION */}

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {resource.description ||
                        "No description provided."}
                    </p>


                    {/* DETAILS */}

                    <div className="mt-5 space-y-1 text-xs text-slate-500">

                      {resource.course && (

                        <p>
                          <span className="font-semibold text-slate-700">
                            Course:
                          </span>{" "}
                          {resource.course}
                        </p>

                      )}

                      {resource.subject && (

                        <p>
                          <span className="font-semibold text-slate-700">
                            Subject:
                          </span>{" "}
                          {resource.subject}
                        </p>

                      )}

                      <p>
                        <span className="font-semibold text-slate-700">
                          Downloads:
                        </span>{" "}
                        {resource.download_count ||
                          0}
                      </p>

                      <p>
                        <span className="font-semibold text-slate-700">
                          Uploaded:
                        </span>{" "}
                        {formatDate(
                          resource.created_at
                        )}
                      </p>

                    </div>


                    {/* ACTIONS */}

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                      <Link
                        to={`/resource/${resource.id}`}
                        className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700"
                      >
                        View Resource
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          openDeleteModal(
                            resource
                          )
                        }
                        className="rounded-lg border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>


        {/* =================================================
            SAVED RESOURCES
        ================================================== */}

        <section className="mt-12">

          <div className="mb-6">

            <h2 className="text-2xl font-bold">
              Saved Resources
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Resources you bookmarked for later.
            </p>

          </div>


          {bookmarks.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

              <h3 className="text-lg font-semibold">
                No saved resources
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Bookmark resources you want to
                come back to later.
              </p>

              <Link
                to="/hub"
                className="mt-5 inline-flex rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Browse Resources
              </Link>

            </div>

          ) : (

            <div className="grid gap-6 md:grid-cols-2">

              {bookmarks.map(
                (bookmark) => {

                  const resource =
                    bookmark.resources;

                  if (!resource) {
                    return null;
                  }

                  return (

                    <article
                      key={bookmark.id}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >

                      <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {resource.categories?.name ||
                          "Uncategorized"}
                      </span>


                      <h3 className="mt-4 line-clamp-2 text-lg font-bold">
                        {resource.title}
                      </h3>


                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {resource.description ||
                          "No description provided."}
                      </p>


                      <div className="mt-5 space-y-1 text-xs text-slate-500">

                        {resource.course && (

                          <p>
                            <span className="font-semibold text-slate-700">
                              Course:
                            </span>{" "}
                            {resource.course}
                          </p>

                        )}

                        {resource.subject && (

                          <p>
                            <span className="font-semibold text-slate-700">
                              Subject:
                            </span>{" "}
                            {resource.subject}
                          </p>

                        )}

                        <p>
                          <span className="font-semibold text-slate-700">
                            Downloads:
                          </span>{" "}
                          {resource.download_count ||
                            0}
                        </p>

                      </div>


                      <div className="mt-5 border-t border-slate-100 pt-4">

                        <Link
                          to={`/resource/${resource.id}`}
                          className="inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700"
                        >
                          View Resource
                        </Link>

                      </div>

                    </article>

                  );

                }
              )}

            </div>

          )}

        </section>


        {/* MOBILE UPLOAD */}

        <div className="mt-10 sm:hidden">

          <Link
            to="/upload"
            className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Upload Resource
          </Link>

        </div>

      </main>


      {/* =====================================================
          DELETE RESOURCE MODAL
      ====================================================== */}

      {deleteModal && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-6 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl">

            {/* ICON */}

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">

              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86l-8.82 15a2 2 0 001.71 3h17.64a2 2 0 001.71-3l-8.82-15a2 2 0 00-3.42 0z"
                />

              </svg>

            </div>


            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Delete Resource?
            </h2>


            <p className="mt-2 text-sm leading-6 text-slate-500">

              Are you sure you want to delete{" "}

              <span className="font-semibold text-slate-700">
                "{resourceToDelete?.title}"
              </span>

              ?

              <br />

              This action cannot be undone.

            </p>


            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={handleDeleteResource}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Resource"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );
}

export default Profile;