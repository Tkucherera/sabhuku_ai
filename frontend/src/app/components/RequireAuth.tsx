import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "./AuthContext";

export function RequireAuth() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  }

  return <Outlet />;
}
