import { useEffect, useState } from "react";
import { TrendingUp, Users, Star, Clock, ArrowRight, Database, Box } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { PlatformLayout } from "./PlatformLayout";
import { useAuth } from "./AuthContext";
import { fetchDashboard, DashboardSummary } from "../api/dashboardApi";
import { buildDatasetPath } from "../api/datasetApi";

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently"
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const allowedRichTextTags = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "em",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "u",
  "ul",
]);

const sanitizeRichText = (value: string) => {
  if (!value.trim() || typeof window === "undefined") {
    return "";
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(value, "text/html");

  const sanitizeNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    if (!allowedRichTextTags.has(tagName)) {
      const parent = element.parentNode;
      if (!parent) return;

      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }

      parent.removeChild(element);
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();

      if (tagName === "a" && name === "href") {
        const href = element.getAttribute("href") ?? "";
        if (/^(https?:|mailto:|tel:)/i.test(href)) {
          element.setAttribute("target", "_blank");
          element.setAttribute("rel", "noopener noreferrer");
          return;
        }
      }

      element.removeAttribute(attribute.name);
    });

    Array.from(element.childNodes).forEach(sanitizeNode);
  };

  Array.from(document.body.childNodes).forEach(sanitizeNode);

  return document.body.innerHTML;
};

function RichTextDescription({ value }: { value: string }) {
  const sanitizedValue = sanitizeRichText(value);

  if (!sanitizedValue) {
    return <p className="text-sm text-gray-600 mb-2">No description yet.</p>;
  }

  return (
    <div
      className="text-sm text-gray-600 mb-2 space-y-2 [&_a]:text-blue-600 [&_a]:underline [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_li]:ml-5 [&_li]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:mb-2 [&_p:last-child]:mb-0 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-gray-100 [&_pre]:p-2 [&_ul]:ml-5"
      dangerouslySetInnerHTML={{ __html: sanitizedValue }}
    />
  );
}

export function Dashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const data = await fetchDashboard(token);
        if (cancelled) return;
        setDashboard(data);
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Failed to load dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [navigate, token]);

  const firstName = dashboard?.user.first_name?.trim() || dashboard?.user.public_username || "there";

  return (
    <PlatformLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}! </h1>
          <p className="text-blue-100 mb-6">
            Track your uploads, discover what is trending, and keep building with the community.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/models"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 font-medium"
            >
              Browse Models
            </Link>
            <Link
              to="/datasets"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-400 font-medium"
            >
              Explore Datasets
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Your Models",
              value: dashboard?.stats.your_models ?? 0,
              helper: "Published on the platform",
              icon: Box,
              color: "text-blue-600",
            },
            {
              label: "Your Datasets",
              value: dashboard?.stats.your_datasets ?? 0,
              helper: "Available in your profile",
              icon: Database,
              color: "text-green-600",
            },
            {
              label: "Total Downloads",
              value: dashboard?.stats.total_downloads ?? 0,
              helper: "Across your uploads",
              icon: Star,
              color: "text-orange-600",
            },
            {
              label: "Community Members",
              value: dashboard?.stats.community_members ?? 0,
              helper: `${dashboard?.stats.community_models ?? 0} models · ${dashboard?.stats.community_datasets ?? 0} datasets`,
              icon: Users,
              color: "text-purple-600",
            },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">{item.label}</span>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatCompactNumber(item.value)}</div>
              <div className="text-sm text-gray-600 mt-1">{item.helper}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Trending Models</h2>
                  <Link to="/models" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                    View all
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-200">
                  {(dashboard?.trending_models ?? []).length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">No models have been published yet.</div>
                  ) : (
                    dashboard?.trending_models.map((model) => (
                      <div key={model.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-bold text-gray-900 mb-1">{model.name}</h3>
                            <RichTextDescription value={model.description || ""} />
                            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {model.author_username || "Unknown author"}
                              </span>
                              <span>↓ {formatCompactNumber(model.downloads)}</span>
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                {model.likes}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">{formatTimestamp(model.updated)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Popular Datasets</h2>
                  <Link to="/datasets" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                    View all
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-200">
                  {(dashboard?.popular_datasets ?? []).length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">No public datasets are available yet.</div>
                  ) : (
                    dashboard?.popular_datasets.map((dataset) => (
                      <Link
                        key={dataset.id}
                        to={buildDatasetPath(dataset)}
                        className="block p-6 hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="font-bold text-gray-900 mb-1">{dataset.name}</h3>
                        <RichTextDescription value={dataset.description || ""} />
                        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                          <span>{dataset.size}</span>
                          <span>↓ {formatCompactNumber(dataset.downloads)}</span>
                          <span>Updated {formatTimestamp(dataset.updated)}</span>
                          <span>@{dataset.author_public_username}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Your Recent Activity</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Recent Models</h3>
                      <Link to="/profile" className="text-sm text-blue-600 hover:text-blue-700">Manage</Link>
                    </div>
                    <div className="space-y-3">
                      {(dashboard?.recent_user_models ?? []).slice(0, 3).map((model) => (
                        <div key={model.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="font-medium text-gray-900">{model.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{model.category} · {formatTimestamp(model.updated)}</div>
                        </div>
                      ))}
                      {(dashboard?.recent_user_models ?? []).length === 0 ? (
                        <div className="text-sm text-gray-500">You have not uploaded any models yet.</div>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Recent Datasets</h3>
                      <Link to="/profile" className="text-sm text-green-600 hover:text-green-700">Manage</Link>
                    </div>
                    <div className="space-y-3">
                      {(dashboard?.recent_user_datasets ?? []).slice(0, 3).map((dataset) => (
                        <Link key={dataset.id} to={buildDatasetPath(dataset)} className="block border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                          <div className="font-medium text-gray-900">{dataset.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{dataset.size} · {formatTimestamp(dataset.updated)}</div>
                        </Link>
                      ))}
                      {(dashboard?.recent_user_datasets ?? []).length === 0 ? (
                        <div className="text-sm text-gray-500">You have not uploaded any datasets yet.</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <Link to="/profile" className="block w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium">
                    + Upload Model
                  </Link>
                  <Link to="/profile" className="block w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium">
                    + Add Dataset
                  </Link>
                  <Link to="/datasets" className="block w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium">
                    Browse Community Work
                  </Link>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
                <h3 className="font-bold mb-4">Community Snapshot</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-2xl font-bold">{formatCompactNumber(dashboard?.stats.community_members ?? 0)}</div>
                    <div className="text-blue-100 text-sm">Active Members</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatCompactNumber(dashboard?.stats.community_models ?? 0)}</div>
                    <div className="text-blue-100 text-sm">Models Shared</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatCompactNumber(dashboard?.stats.community_datasets ?? 0)}</div>
                    <div className="text-blue-100 text-sm">Datasets Published</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
