import { Link, useLocation } from "react-router";
import { Brain, Home, Database, Box, BookOpen, User, Search, Bell, Settings, LogOut } from "lucide-react";

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export function PlatformLayout({ children }: PlatformLayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center gap-2">
                <Brain className="w-8 h-8 text-blue-600" />
                <span className="font-bold text-xl">SABHUKU AI</span>
              </Link>
              
              <div className="hidden md:flex items-center gap-6">
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    isActive("/dashboard")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  to="/models"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    isActive("/models")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Box className="w-4 h-4" />
                  Models
                </Link>
                <Link
                  to="/datasets"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    isActive("/datasets")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Database className="w-4 h-4" />
                  Datasets
                </Link>
                <Link
                  to="/learning"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    isActive("/learning")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Learning
                </Link>
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
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  JD
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
