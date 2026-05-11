import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Brain } from "lucide-react";

import { getProfile } from "../../api/authApi";
import { useAuth } from "../AuthContext";

type NavProfile = {
  first_name: string;
  last_name: string;
  public_username: string;
  avatar_url: string;
};

const buildInitials = (profile: NavProfile | null) => {
  const first = profile?.first_name?.trim()?.[0] ?? "";
  const last = profile?.last_name?.trim()?.[0] ?? "";
  const fallback = profile?.public_username?.trim()?.slice(0, 2) ?? "SA";
  return `${first}${last}`.trim().toUpperCase() || fallback.toUpperCase();
};

export function Nav() {
  const { token, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<NavProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!token) {
        setProfile(null);
        return;
      }

      try {
        const data = await getProfile(token);
        if (!cancelled) {
          setProfile({
            first_name: data.first_name,
            last_name: data.last_name,
            public_username: data.public_username,
            avatar_url: data.avatar_url,
          });
        }
      } catch {
        if (!cancelled) setProfile(null);
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const initials = buildInitials(profile);

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="font-bold text-xl">SABHUKU AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="/#services" className="text-gray-800 font-semibold hover:text-blue-600">Services</a>
            <a href="/#about" className="text-gray-800 font-semibold hover:text-blue-600">About</a>
            <a href="/#features" className="text-gray-800 font-semibold hover:text-blue-600">Features</a>
            <a href="/community/tutorials/" className="text-gray-800 font-semibold hover:text-blue-600">Community Tutorials</a>
          </div>
          {isAuthenticated ? (
            <Link to="/profile" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg" aria-label="Open profile">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.public_username || "Profile"} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-gray-700 hover:text-blue-600 px-4 py-2">
                Login
              </Link>
              <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
