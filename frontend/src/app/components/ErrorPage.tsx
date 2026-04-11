import { Link, useRouteError, isRouteErrorResponse } from "react-router";

export function ErrorPage() {
  const error = useRouteError();

  const title = isRouteErrorResponse(error)
    ? error.status === 404
      ? "404 — Page not found"
      : error.status === 500
      ? "500 — Server got lost"
      : `${error.status} — Oops`
    : "Oops — Something went wrong";

  const message = isRouteErrorResponse(error)
    ? error.status === 404
      ? "Aiwa, this page is not here. Maybe it went on a walk?"
      : error.status === 500
      ? "Our server is taking a kuku break. Try again in a few moments."
      : "This page hit a problem. Refresh or return home and try again."
    : "Looks like something went wrong while loading the page."

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4 py-10">
      <div className="max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/95 p-10 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-300">System notice</p>
          <h1 className="mt-4 text-4xl font-bold text-white">{title}</h1>
          <p className="mt-4 text-lg text-slate-300">{message}</p>
        </div>

        <div className="space-y-3 text-slate-300">
          <p>
            If this is your first time here, go back home and try again. If the problem keeps coming, our server is probably tired.
          </p>
          <p className="text-sm text-slate-500">
            No shame — even good systems need a break after too much load shedding.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Go back home
          </Link>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-transparent px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
