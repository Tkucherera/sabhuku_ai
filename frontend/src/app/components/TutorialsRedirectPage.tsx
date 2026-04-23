import { useEffect, useMemo, useState } from "react";

function resolveTutorialsUrl(pathname: string, search: string, hash: string) {
  const { protocol, hostname, port } = window.location;

  if (port === "5173") {
    return `${protocol}//${hostname}:8000${pathname}${search}${hash}`;
  }

  if ((hostname === "localhost" || hostname === "127.0.0.1") && port !== "8000") {
    return `${protocol}//${hostname}:8000${pathname}${search}${hash}`;
  }

  return `${window.location.origin}${pathname}${search}${hash}`;
}

export function TutorialsRedirectPage() {
  const [blockedRedirect, setBlockedRedirect] = useState(false);
  const destination = useMemo(
    () =>
      resolveTutorialsUrl(
        window.location.pathname,
        window.location.search,
        window.location.hash
      ),
    []
  );

  useEffect(() => {
    if (destination === window.location.href) {
      setBlockedRedirect(true);
      return;
    }

    window.location.replace(destination);
  }, [destination]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-bold text-white">Opening Community Tutorials</h1>
        <p className="mt-3 max-w-md text-sm text-slate-300">
          {blockedRedirect
            ? "The frontend caught this path, but the backend tutorial route is not being proxied yet."
            : "Redirecting you to the public tutorials hub."}
        </p>
        {blockedRedirect ? (
          <a
            href={`http://localhost:8000${window.location.pathname}${window.location.search}${window.location.hash}`}
            className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Open backend tutorial page
          </a>
        ) : null}
      </div>
    </div>
  );
}
