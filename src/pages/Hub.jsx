import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Hub() {
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  // =========================================================
  // FETCH DATA
  // =========================================================

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      // =====================================================
      // GET CATEGORIES
      // =====================================================

      const {
        data: categoryData,
        error: categoryError,
      } = await supabase
        .from("categories")
        .select("*")
        .order("name", {
          ascending: true,
        });

      if (categoryError) {
        throw categoryError;
      }

      // =====================================================
      // GET RESOURCES + CATEGORY + PROFILE
      // =====================================================

      const {
        data: resourceData,
        error: resourceError,
      } = await supabase
        .from("resources")
        .select(`
          id,
          title,
          description,
          file_path,
          thumbnail_path,
          course,
          subject,
          uploaded_by,
          download_count,
          created_at,
          category_id,

          categories (
            id,
            name
          ),

          profiles (
            id,
            username,
            display_name
          )
        `)
        .order("created_at", {
          ascending: false,
        });

      if (resourceError) {
        throw resourceError;
      }

      setCategories(categoryData || []);
      setResources(resourceData || []);

    } catch (err) {
      console.error(err);

      setError(
        err.message || "Failed to load resources."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FILTER RESOURCES
  // =========================================================

  const filteredResources = resources.filter((resource) => {
    const searchText = search
      .toLowerCase()
      .trim();

    const matchesSearch =
      !searchText ||
      resource.title
        ?.toLowerCase()
        .includes(searchText) ||
      resource.description
        ?.toLowerCase()
        .includes(searchText) ||
      resource.course
        ?.toLowerCase()
        .includes(searchText) ||
      resource.subject
        ?.toLowerCase()
        .includes(searchText);

    const matchesCategory =
      selectedCategory === "" ||
      String(resource.category_id) ===
        String(selectedCategory);

    return (
      matchesSearch &&
      matchesCategory
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

          <Link
            to="/hub"
            className="text-lg font-bold tracking-tight text-slate-900"
          >
            ShareShelf
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium">

            <Link
              to="/hub"
              className="text-indigo-600"
            >
              Home
            </Link>

            <Link
              to="/profile"
              className="text-slate-600 transition hover:text-indigo-600"
            >
              Profile
            </Link>

            <Link
              to="/upload"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-white transition hover:bg-indigo-700"
            >
              Upload Resource
            </Link>

          </nav>

        </div>

      </header>


      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-6 py-20">

          <div className="max-w-3xl">

            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-indigo-600">
              ShareShelf
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">

              Discover resources.

              <br />

              <span className="text-indigo-600">
                Share knowledge.
              </span>

            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">

              Find notes, reviewers, e-books,
              presentations, research materials,
              and other useful resources shared
              by the community.

            </p>

            <div className="mt-8 flex flex-wrap gap-3">

              <Link
                to="/upload"
                className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Upload a Resource
              </Link>

              <a
                href="#resources"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
              >
                Browse Resources
              </a>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          SEARCH
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-6 pt-10">

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Search resources
          </label>

          <input
            type="text"
            placeholder="Search by title, subject, course, or description..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />

        </div>

      </section>


      {/* =====================================================
          CATEGORIES
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-12">

        <div className="mb-6">

          <h2 className="text-2xl font-bold text-slate-900">
            Browse Categories
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Find resources based on your area of interest.
          </p>

        </div>

        <div className="flex flex-wrap gap-3">

          {/* ALL */}

          <button
            onClick={() =>
              setSelectedCategory("")
            }
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              selectedCategory === ""
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-slate-300 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            All
          </button>


          {/* CATEGORIES */}

          {categories.map((category) => {

            const active =
              String(selectedCategory) ===
              String(category.id);

            return (
              <button
                key={category.id}
                onClick={() =>
                  setSelectedCategory(category.id)
                }
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "border border-slate-300 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {category.name}
              </button>
            );
          })}

        </div>

      </section>


      {/* =====================================================
          RESOURCES
      ====================================================== */}

      <section
        id="resources"
        className="mx-auto max-w-7xl px-6 pb-20"
      >

        <div className="mb-6 flex items-end justify-between">

          <div>

            <h2 className="text-2xl font-bold text-slate-900">
              Resources
            </h2>

            <p className="mt-1 text-sm text-slate-500">

              {filteredResources.length} resource
              {filteredResources.length !== 1
                ? "s"
                : ""}{" "}
              found

            </p>

          </div>

        </div>


        {/* ===================================================
            LOADING
        ==================================================== */}

        {loading && (

          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">

            <p className="text-sm text-slate-500">
              Loading resources...
            </p>

          </div>

        )}


        {/* ===================================================
            ERROR
        ==================================================== */}

        {error && (

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">

            <p className="font-medium text-red-600">
              {error}
            </p>

          </div>

        )}


        {/* ===================================================
            EMPTY
        ==================================================== */}

        {!loading &&
          !error &&
          filteredResources.length === 0 && (

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">

              <h3 className="text-xl font-bold text-slate-900">
                No resources found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">

                Try changing your search or selecting
                another category.

              </p>

              <Link
                to="/upload"
                className="mt-6 inline-flex rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Upload a Resource
              </Link>

            </div>

          )}


        {/* ===================================================
            RESOURCE CARDS
        ==================================================== */}

        {!loading &&
          !error &&
          filteredResources.length > 0 && (

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {filteredResources.map((resource) => {

                /*
                 * PROFILE DATA
                 *
                 * This comes directly from the profiles table.
                 * Therefore, when the uploader changes their
                 * username/display name, the updated information
                 * will be displayed here.
                 */

                const uploader =
                  resource.profiles;

                const uploaderName =
                  uploader?.display_name ||
                  uploader?.username ||
                  "Unknown User";

                const uploaderUsername =
                  uploader?.username ||
                  "unknown";

                const uploaderInitial =
                  uploaderName
                    .charAt(0)
                    .toUpperCase();

                return (

                  <article
                    key={resource.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >

                    {/* =================================================
                        THUMBNAIL
                    ================================================== */}

                    <div className="h-48 overflow-hidden bg-slate-100">

                      {resource.thumbnail_path ? (

                        <img
                          src={resource.thumbnail_path}
                          alt={resource.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />

                      ) : (

                        <div className="flex h-full flex-col items-center justify-center">

                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                            📄
                          </div>

                          <span className="mt-3 text-sm font-medium text-slate-400">
                            No preview available
                          </span>

                        </div>

                      )}

                    </div>


                    {/* =================================================
                        CONTENT
                    ================================================== */}

                    <div className="p-6">

                      {/* CATEGORY */}

                      <div className="mb-3">

                        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">

                          {resource.categories?.name ||
                            "Uncategorized"}

                        </span>

                      </div>


                      {/* TITLE */}

                      <h3 className="line-clamp-2 text-lg font-bold text-slate-900">

                        {resource.title}

                      </h3>


                      {/* DESCRIPTION */}

                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">

                        {resource.description ||
                          "No description provided."}

                      </p>


                      {/* =================================================
                          COURSE / SUBJECT
                      ================================================== */}

                      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">

                        {resource.course && (

                          <p className="text-xs text-slate-500">

                            <span className="font-semibold text-slate-700">
                              Course:
                            </span>{" "}

                            {resource.course}

                          </p>

                        )}

                        {resource.subject && (

                          <p className="text-xs text-slate-500">

                            <span className="font-semibold text-slate-700">
                              Subject:
                            </span>{" "}

                            {resource.subject}

                          </p>

                        )}

                      </div>


                      {/* =================================================
                          UPLOADER
                      ================================================== */}

                      <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">

                        {/* AVATAR */}

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">

                          {uploaderInitial}

                        </div>


                        {/* USER INFO */}

                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold text-slate-800">

                            {uploaderName}

                          </p>

                          <p className="truncate text-xs text-slate-400">

                            @{uploaderUsername}

                          </p>

                        </div>

                      </div>


                      {/* =================================================
                          FOOTER
                      ================================================== */}

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                        <div>

                          <span className="text-xs text-slate-400">

                            {resource.download_count || 0} downloads

                          </span>

                        </div>

                        <Link
                          to={`/resource/${resource.id}`}
                          className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                        >
                          View Resource
                        </Link>

                      </div>

                    </div>

                  </article>

                );
              })}

            </div>

          )}

      </section>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-6 py-8">

          <div className="flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">

            <p>
              ShareShelf
            </p>

            <p>
              Share knowledge. Help the community.
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
}

export default Hub;