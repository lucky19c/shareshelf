import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { supabase } from "../lib/supabase";

function ResourceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [comments, setComments] = useState([]);

  const [user, setUser] = useState(null);

  const [commentText, setCommentText] =
    useState("");

  const [userRating, setUserRating] =
    useState(0);

  const [averageRating, setAverageRating] =
    useState(0);

  const [ratingCount, setRatingCount] =
    useState(0);

  const [isBookmarked, setIsBookmarked] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [commentLoading, setCommentLoading] =
    useState(false);

  const [ratingLoading, setRatingLoading] =
    useState(false);

  const [bookmarkLoading, setBookmarkLoading] =
    useState(false);

  const [downloadLoading, setDownloadLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [deleteCommentId, setDeleteCommentId] =
    useState(null);

  const [deletingComment, setDeletingComment] =
    useState(false);

  // =========================================================
  // LOAD
  // =========================================================

  useEffect(() => {
    loadResource();
  }, [id]);

  const loadResource = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: {
          user: currentUser,
        },
      } = await supabase.auth.getUser();

      setUser(currentUser || null);

      // -----------------------------------------------------
      // RESOURCE
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
            name,
            description
          ),

          profiles (
            id,
            username,
            display_name
          )
        `)
        .eq("id", id)
        .single();

      if (resourceError) {
        throw resourceError;
      }

      setResource(resourceData);

      // -----------------------------------------------------
      // COMMENTS
      // -----------------------------------------------------

      const {
        data: commentData,
        error: commentError,
      } = await supabase
        .from("comments")
        .select(`
          id,
          user_id,
          resource_id,
          comment,
          created_at,
          updated_at,

          profiles (
            id,
            username,
            display_name
          )
        `)
        .eq("resource_id", id)
        .order("created_at", {
          ascending: false,
        });

      if (commentError) {
        throw commentError;
      }

      setComments(commentData || []);

      // -----------------------------------------------------
      // RATINGS
      // -----------------------------------------------------

      const {
        data: ratingData,
        error: ratingError,
      } = await supabase
        .from("ratings")
        .select(`
          id,
          user_id,
          resource_id,
          rating
        `)
        .eq("resource_id", id);

      if (ratingError) {
        throw ratingError;
      }

      const ratings = ratingData || [];

      if (ratings.length > 0) {
        const total = ratings.reduce(
          (sum, item) =>
            sum + Number(item.rating || 0),
          0
        );

        setAverageRating(
          total / ratings.length
        );
      } else {
        setAverageRating(0);
      }

      setRatingCount(ratings.length);

      if (currentUser) {

        const existingRating =
          ratings.find(
            (item) =>
              item.user_id === currentUser.id
          );

        setUserRating(
          existingRating
            ? Number(existingRating.rating)
            : 0
        );

        // ---------------------------------------------------
        // BOOKMARK
        // ---------------------------------------------------

        const {
          data: bookmarkData,
          error: bookmarkError,
        } = await supabase
          .from("bookmarks")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("resource_id", id)
          .maybeSingle();

        if (bookmarkError) {
          throw bookmarkError;
        }

        setIsBookmarked(
          Boolean(bookmarkData)
        );
      }

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to load resource."
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // DOWNLOAD
  // =========================================================

  const handleDownload = async () => {
    if (!resource?.file_path) {
      setError(
        "No downloadable file is available for this resource."
      );
      return;
    }

    setDownloadLoading(true);
    setError("");

    try {

      const {
        data: fileData,
        error: fileError,
      } = await supabase.storage
        .from("resources")
        .download(resource.file_path);

      if (fileError) {
        throw fileError;
      }

      const url =
        URL.createObjectURL(fileData);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        resource.file_path
          .split("/")
          .pop() ||
        resource.title;

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(url);

      // -----------------------------------------------------
      // INCREMENT DOWNLOAD COUNT
      // -----------------------------------------------------

      const newCount =
        (resource.download_count || 0) + 1;

      const {
        error: updateError,
      } = await supabase
        .from("resources")
        .update({
          download_count: newCount,
        })
        .eq("id", resource.id);

      if (!updateError) {
        setResource({
          ...resource,
          download_count: newCount,
        });
      }

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to download resource."
      );

    } finally {
      setDownloadLoading(false);
    }
  };

  // =========================================================
  // BOOKMARK
  // =========================================================

  const handleBookmark = async () => {

    if (!user) {
      navigate("/login");
      return;
    }

    setBookmarkLoading(true);
    setError("");
    setMessage("");

    try {

      if (isBookmarked) {

        const {
          error: deleteError,
        } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("resource_id", resource.id);

        if (deleteError) {
          throw deleteError;
        }

        setIsBookmarked(false);

        setMessage(
          "Resource removed from your bookmarks."
        );

      } else {

        const {
          error: insertError,
        } = await supabase
          .from("bookmarks")
          .insert({
            user_id: user.id,
            resource_id: resource.id,
          });

        if (insertError) {
          throw insertError;
        }

        setIsBookmarked(true);

        setMessage(
          "Resource added to your bookmarks."
        );
      }

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to update bookmark."
      );

    } finally {
      setBookmarkLoading(false);
    }
  };

  // =========================================================
  // RATING
  // =========================================================

  const handleRating = async (rating) => {

    if (!user) {
      navigate("/login");
      return;
    }

    setRatingLoading(true);
    setError("");
    setMessage("");

    try {

      const {
        data: existingRating,
        error: existingError,
      } = await supabase
        .from("ratings")
        .select("id")
        .eq("user_id", user.id)
        .eq("resource_id", resource.id)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingRating) {

        const {
          error: updateError,
        } = await supabase
          .from("ratings")
          .update({
            rating,
          })
          .eq("id", existingRating.id);

        if (updateError) {
          throw updateError;
        }

      } else {

        const {
          error: insertError,
        } = await supabase
          .from("ratings")
          .insert({
            user_id: user.id,
            resource_id: resource.id,
            rating,
          });

        if (insertError) {
          throw insertError;
        }
      }

      setUserRating(rating);

      setMessage(
        "Your rating has been saved."
      );

      // Reload rating information
      const {
        data: ratingData,
        error: ratingError,
      } = await supabase
        .from("ratings")
        .select("rating")
        .eq("resource_id", resource.id);

      if (ratingError) {
        throw ratingError;
      }

      const ratings = ratingData || [];

      const total = ratings.reduce(
        (sum, item) =>
          sum + Number(item.rating || 0),
        0
      );

      setAverageRating(
        ratings.length
          ? total / ratings.length
          : 0
      );

      setRatingCount(ratings.length);

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to save rating."
      );

    } finally {
      setRatingLoading(false);
    }
  };

  // =========================================================
  // POST COMMENT
  // =========================================================

  const handlePostComment = async (e) => {

    e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (!commentText.trim()) {
      setError(
        "Please write a comment first."
      );
      return;
    }

    setCommentLoading(true);
    setError("");
    setMessage("");

    try {

      const {
        data: newComment,
        error: commentError,
      } = await supabase
        .from("comments")
        .insert({
          user_id: user.id,
          resource_id: resource.id,
          comment: commentText.trim(),
        })
        .select(`
          id,
          user_id,
          resource_id,
          comment,
          created_at,
          updated_at,

          profiles (
            id,
            username,
            display_name
          )
        `)
        .single();

      if (commentError) {
        throw commentError;
      }

      setComments((current) => [
        newComment,
        ...current,
      ]);

      setCommentText("");

      setMessage(
        "Comment posted successfully."
      );

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to post comment."
      );

    } finally {
      setCommentLoading(false);
    }
  };

  // =========================================================
  // OPEN DELETE COMMENT
  // =========================================================

  const openDeleteComment = (commentId) => {
    setDeleteCommentId(commentId);
  };

  // =========================================================
  // DELETE COMMENT
  // =========================================================

  const handleDeleteComment = async () => {

    if (!user || !deleteCommentId) {
      return;
    }

    setDeletingComment(true);
    setError("");

    try {

      const comment =
        comments.find(
          (item) =>
            item.id === deleteCommentId
        );

      if (!comment) {
        throw new Error(
          "Comment could not be found."
        );
      }

      if (comment.user_id !== user.id) {
        throw new Error(
          "You can only delete your own comments."
        );
      }

      const {
        error: deleteError,
      } = await supabase
        .from("comments")
        .delete()
        .eq("id", deleteCommentId)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      setComments((current) =>
        current.filter(
          (item) =>
            item.id !== deleteCommentId
        )
      );

      setDeleteCommentId(null);

      setMessage(
        "Comment deleted successfully."
      );

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to delete comment."
      );

    } finally {
      setDeletingComment(false);
    }
  };

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

          <div className="mx-auto flex h-16 max-w-7xl items-center px-6">

            <Link
              to="/hub"
              className="text-lg font-bold text-slate-900"
            >
              ShareShelf
            </Link>

          </div>

        </header>

        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">

          <p className="text-sm text-slate-500">
            Loading resource...
          </p>

        </main>

      </div>

    );
  }

  // =========================================================
  // RESOURCE NOT FOUND
  // =========================================================

  if (!resource) {

    return (

      <div className="min-h-screen bg-slate-50">

        <main className="mx-auto max-w-xl px-6 py-20">

          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

            <h1 className="text-xl font-bold text-red-700">
              Resource unavailable
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error ||
                "This resource could not be found."}
            </p>

            <Link
              to="/hub"
              className="mt-6 inline-flex rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Back to Resources
            </Link>

          </div>

        </main>

      </div>

    );
  }

  const displayName =
    resource.profiles?.display_name ||
    resource.profiles?.username ||
    "Unknown User";

  const username =
    resource.profiles?.username ||
    "unknown";

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
              className="text-slate-600 hover:text-indigo-600"
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

      <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8">

        <Link
          to="/hub"
          className="inline-flex text-sm font-medium text-slate-600 hover:text-indigo-600"
        >
          ← Back to Resources
        </Link>


        {/* ERROR */}

        {error && (

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="text-sm font-medium text-red-600">
              {error}
            </p>

          </div>

        )}


        {/* MESSAGE */}

        {message && (

          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">

            <p className="text-sm font-medium text-green-700">
              {message}
            </p>

          </div>

        )}


        {/* =================================================
            RESOURCE CARD
        ================================================== */}

        <article className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* PREVIEW */}

          {resource.thumbnail_path ? (

            <img
              src={resource.thumbnail_path}
              alt={resource.title}
              className="h-72 w-full object-cover sm:h-96"
            />

          ) : (

            <div className="flex h-72 items-center justify-center bg-slate-100 sm:h-96">

              <div className="text-center">

                <div className="text-5xl">
                  📄
                </div>

                <p className="mt-3 text-sm text-slate-400">
                  No preview available
                </p>

              </div>

            </div>

          )}


          {/* RESOURCE INFO */}

          <div className="p-7 sm:p-9">

            <div className="flex flex-wrap gap-2">

              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {resource.categories?.name ||
                  "Uncategorized"}
              </span>

              {resource.course && (

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {resource.course}
                </span>

              )}

              {resource.subject && (

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {resource.subject}
                </span>

              )}

            </div>


            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {resource.title}
            </h1>


            <p className="mt-4 whitespace-pre-line text-base leading-7 text-slate-600">
              {resource.description ||
                "No description provided."}
            </p>


            {/* UPLOADER */}

            <div className="mt-7 flex items-center gap-3 border-t border-slate-100 pt-6">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">

                {displayName
                  .charAt(0)
                  .toUpperCase()}

              </div>

              <div>

                <p className="font-semibold text-slate-900">
                  {displayName}
                </p>

                <p className="text-sm text-slate-500">
                  @{username}
                </p>

              </div>

              <span className="ml-auto text-xs text-slate-400">
                {formatDate(
                  resource.created_at
                )}
              </span>

            </div>


            {/* ACTIONS */}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloadLoading}
                className="flex-1 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloadLoading
                  ? "Downloading..."
                  : "Download Resource"}
              </button>


              <button
                type="button"
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                className={`flex-1 rounded-lg border px-5 py-3 text-sm font-semibold transition ${
                  isBookmarked
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    : "border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {bookmarkLoading
                  ? "Saving..."
                  : isBookmarked
                  ? "★ Bookmarked"
                  : "☆ Bookmark"}
              </button>

            </div>


            {/* DOWNLOAD COUNT */}

            <p className="mt-3 text-center text-xs text-slate-400">
              {resource.download_count || 0} downloads
            </p>

          </div>

        </article>


        {/* =================================================
            RATINGS
        ================================================== */}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Ratings
              </h2>

              <div className="mt-2 flex items-center gap-3">

                <span className="text-3xl font-bold text-slate-900">
                  {averageRating
                    ? averageRating.toFixed(1)
                    : "0.0"}
                </span>

                <div>

                  <div className="flex">

                    {[1, 2, 3, 4, 5].map(
                      (star) => (

                        <span
                          key={star}
                          className={
                            star <=
                            Math.round(
                              averageRating
                            )
                              ? "text-yellow-400"
                              : "text-slate-300"
                          }
                        >
                          ★
                        </span>

                      )
                    )}

                  </div>

                  <p className="text-xs text-slate-400">
                    {ratingCount}{" "}
                    rating
                    {ratingCount !== 1
                      ? "s"
                      : ""}
                  </p>

                </div>

              </div>

            </div>


            <div>

              <p className="mb-2 text-sm font-semibold text-slate-700">
                Your Rating
              </p>

              <div className="flex gap-1">

                {[1, 2, 3, 4, 5].map(
                  (star) => (

                    <button
                      type="button"
                      key={star}
                      disabled={ratingLoading}
                      onClick={() =>
                        handleRating(star)
                      }
                      className={`text-3xl transition hover:scale-110 ${
                        star <= userRating
                          ? "text-yellow-400"
                          : "text-slate-300 hover:text-yellow-300"
                      }`}
                    >
                      ★
                    </button>

                  )
                )}

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            COMMENTS
        ================================================== */}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <div>

            <h2 className="text-2xl font-bold text-slate-900">
              Comments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Share your thoughts about this resource.
            </p>

          </div>


          {/* COMMENT FORM */}

          <form
            onSubmit={handlePostComment}
            className="mt-6"
          >

            <textarea
              value={commentText}
              onChange={(e) =>
                setCommentText(
                  e.target.value
                )
              }
              placeholder="Write a comment..."
              rows={5}
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            <div className="mt-3 flex justify-end">

              <button
                type="submit"
                disabled={commentLoading}
                className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {commentLoading
                  ? "Posting..."
                  : "Post Comment"}
              </button>

            </div>

          </form>


          {/* COMMENTS */}

          <div className="mt-8 space-y-4">

            {comments.length === 0 ? (

              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">

                <p className="text-sm text-slate-500">
                  No comments yet.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Be the first to share your thoughts.
                </p>

              </div>

            ) : (

              comments.map((comment) => {

                const commentDisplayName =
                  comment.profiles
                    ?.display_name ||
                  comment.profiles
                    ?.username ||
                  "Unknown User";

                const commentUsername =
                  comment.profiles
                    ?.username ||
                  "unknown";

                const isOwner =
                  user &&
                  comment.user_id ===
                    user.id;

                return (

                  <article
                    key={comment.id}
                    className="rounded-xl border border-slate-200 p-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">

                          {commentDisplayName
                            .charAt(0)
                            .toUpperCase()}

                        </div>

                        <div>

                          <p className="text-sm font-semibold text-slate-900">
                            {commentDisplayName}
                          </p>

                          <p className="text-xs text-slate-400">
                            @{commentUsername}
                            {" · "}
                            {formatDate(
                              comment.created_at
                            )}
                          </p>

                        </div>

                      </div>


                      {isOwner && (

                        <button
                          type="button"
                          onClick={() =>
                            openDeleteComment(
                              comment.id
                            )
                          }
                          className="text-xs font-semibold text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>

                      )}

                    </div>


                    <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {comment.comment}
                    </p>

                  </article>

                );
              })

            )}

          </div>

        </section>

      </main>


      {/* =====================================================
          DELETE COMMENT MODAL
      ====================================================== */}

      {deleteCommentId && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-6 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">

              <span className="text-xl text-red-600">
                !
              </span>

            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Delete Comment?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete
              this comment? This action cannot
              be undone.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  setDeleteCommentId(null)
                }
                disabled={deletingComment}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteComment}
                disabled={deletingComment}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingComment
                  ? "Deleting..."
                  : "Delete Comment"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default ResourceDetails;