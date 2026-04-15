import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

import { AUTH_REDIRECT_EVENT } from "../auth";
import { useAuth } from "./AuthContext";

export function AuthRedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handleAuthRedirect = () => {
      logout();

      if (location.pathname !== "/login") {
        navigate("/login", {
          replace: true,
          state: { from: `${location.pathname}${location.search}${location.hash}` },
        });
      }
    };

    window.addEventListener(AUTH_REDIRECT_EVENT, handleAuthRedirect);

    return () => {
      window.removeEventListener(AUTH_REDIRECT_EVENT, handleAuthRedirect);
    };
  }, [location.hash, location.pathname, location.search, logout, navigate]);

  return null;
}
