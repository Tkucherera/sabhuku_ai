import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Brain, Home, Database, Box, BookOpen, Search, Bell } from "lucide-react";

import { getProfile } from "../api/authApi";
import { useAuth } from "./AuthContext";

interface PlatformLayoutProps {
  children: React.ReactNode;
}

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

export function PlatformLayout({ children }: PlatformLayoutProps) {
  const location = useLocation();
  const { token } = useAuth();
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
        if (!cancelled) {
          setProfile(null);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const initials = buildInitials(profile);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center gap-2">
                <Brain className="w-8 h-8 text-blue-600" />
                <span className="font-bold text-xl">SABHUKU AI</span>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                {[
                  { to: "/dashboard", label: "Dashboard", icon: Home },
                  { to: "/models", label: "Models", icon: Box },
                  { to: "/datasets", label: "Datasets", icon: Database },
                  { to: "/learning", label: "Learning", icon: BookOpen },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      isActive(item.to)
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
                <a
                  href="/community/tutorials/"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  <BookOpen className="w-4 h-4" />
                  Community Tutorials
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search models, datasets..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <Link to="/profile" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.public_username || "Profile"} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
