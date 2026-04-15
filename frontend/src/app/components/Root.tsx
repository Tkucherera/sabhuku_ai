import { Outlet } from "react-router";

import { AuthRedirectHandler } from "./AuthRedirectHandler";

export function Root() {
  return (
    <div className="min-h-screen bg-white">
      <AuthRedirectHandler />
      <Outlet />
    </div>
  );
}
