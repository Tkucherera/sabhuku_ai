import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Calendar, Database, Download, EyeOff, Globe, Lock, Save, Tag, User2 } from "lucide-react";

import { PlatformLayout } from "./PlatformLayout";
import { useAuth } from "./AuthContext";
import { getProfile } from "../api/authApi";
import {
  Dataset,
  fetchDatasetByOwnerAndSlug,
  requestDatasetDownloadUrl,
  updateDataset,
} from "../api/datasetApi";

const formatDate = (value: string | null | undefined) => {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const formatUpdated = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const toCommaSeparatedList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export function DatasetPage() {
  const { publicUsername, datasetSlug } = useParams();
  const { token } = useAuth();

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "settings" | "discussions">("overview");
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    subtitle: "",
    description: "",
    tags: "",
    dataset_thumbnail: "",
    authors: "",
    source: "",
    is_public: true,
  });

  useEffect(() => {
    let cancelled = false;

    const loadDataset = async () => {
      if (!publicUsername || !datasetSlug) {
        setError("Dataset URL is incomplete.");
        setLoading(false);
        return;
      }

      try {
        const [datasetResponse, profileResponse] = await Promise.all([
          fetchDatasetByOwnerAndSlug(publicUsername, datasetSlug, token),
          token ? getProfile(token).catch(() => null) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setDataset(datasetResponse);
        setSettingsForm({
          subtitle: datasetResponse.subtitle || "",
          description: datasetResponse.description || "",
          tags: datasetResponse.tags.join(", "),
          dataset_thumbnail: datasetResponse.dataset_thumbnail || "",
          authors: datasetResponse.authors || "",
          source: datasetResponse.source || "",
          is_public: datasetResponse.is_public,
        });
        setIsOwner(profileResponse?.public_username === datasetResponse.author_public_username);
        setError(null);
      } catch {
        if (!cancelled) {
          setError("We couldn't load that dataset. It may be private, moved, or missing.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDataset();

    return () => {
      cancelled = true;
    };
  }, [datasetSlug, publicUsername, token]);

  const handleDownload = async () => {
    if (!dataset) return;

    setDownloading(true);
    try {
      const { url } = await requestDatasetDownloadUrl(dataset.id);
      window.location.assign(url);
    } catch {
      setError("Failed to generate the download link.");
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!dataset || !token || !isOwner) return;

    setSaving(true);
    try {
      const updatedDataset = await updateDataset(token, dataset.id, {
        subtitle: settingsForm.subtitle.trim(),
        description: settingsForm.description.trim(),
        tags: toCommaSeparatedList(settingsForm.tags),
        dataset_thumbnail: settingsForm.dataset_thumbnail.trim(),
        authors: settingsForm.authors.trim(),
        source: settingsForm.source.trim(),
        is_public: settingsForm.is_public,
      });
      setDataset(updatedDataset);
      setSettingsForm({
        subtitle: updatedDataset.subtitle || "",
        description: updatedDataset.description || "",
        tags: updatedDataset.tags.join(", "),
        dataset_thumbnail: updatedDataset.dataset_thumbnail || "",
        authors: updatedDataset.authors || "",
        source: updatedDataset.source || "",
        is_public: updatedDataset.is_public,
      });
      setError(null);
    } catch {
      setError("Failed to save dataset settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </PlatformLayout>
    );
  }

  if (!dataset) {
    return (
      <PlatformLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white border border-red-200 rounded-2xl p-6 text-red-700">{error || "Dataset not found."}</div>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/datasets" className="text-sm text-green-700 hover:text-green-800 font-medium">
            ← Back to datasets
          </Link>
        </div>

        {error ? (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        ) : null}

        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="h-52 bg-gradient-to-br from-green-700 via-emerald-600 to-teal-500 relative">
            {dataset.dataset_thumbnail ? (
              <img src={dataset.dataset_thumbnail} alt={dataset.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-slate-950/25" />
          </div>

          <div className="px-6 sm:px-8 py-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                    {dataset.category}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                    {dataset.license}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${dataset.is_public ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
                    {dataset.is_public ? "Public" : "Private"}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{dataset.name}</h1>
                <p className="mt-3 text-lg text-gray-600">
                  {dataset.subtitle || "A published dataset ready for download and reuse."}
                </p>
                <div className="mt-4 flex flex-wrap gap-5 text-sm text-gray-500">
                  <span className="flex items-center gap-2"><User2 className="w-4 h-4" />@{dataset.author_public_username}</span>
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />Updated {formatUpdated(dataset.updated)}</span>
                  <span className="flex items-center gap-2"><Database className="w-4 h-4" />{dataset.size}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-56">
                <button
                  type="button"
                  onClick={() => void handleDownload()}
                  disabled={downloading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 font-medium disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {downloading ? "Preparing..." : "Download dataset"}
                </button>
                <div className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-100 text-gray-800 font-medium">
                  <User2 className="w-4 h-4" />
                  Published by @{dataset.author_public_username}
                </div>
              </div>
            </div>

            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mt-8 w-fit">
              {[
                { id: "overview", label: "Overview" },
                { id: "discussions", label: "Discussions" },
                ...(isOwner ? [{ id: "settings", label: "Settings" }] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as "overview" | "settings" | "discussions")}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === "overview" ? (
          <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-6 mt-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-7">
                {dataset.description || "No description has been added yet."}
              </p>

              {dataset.tags.length > 0 ? (
                <>
                  <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {dataset.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Metadata</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Formats</span>
                    <span className="text-gray-900 text-right">{dataset.format.join(", ") || "Unknown"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Authors</span>
                    <span className="text-gray-900 text-right">{dataset.authors || "Not set"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Source</span>
                    <span className="text-gray-900 text-right">{dataset.source || "Not set"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Coverage start</span>
                    <span className="text-gray-900 text-right">{formatDate(dataset.coverage_start_date)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Coverage end</span>
                    <span className="text-gray-900 text-right">{formatDate(dataset.coverage_end_date)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Downloads</span>
                    <span className="text-gray-900 text-right">{dataset.downloads.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Access</h2>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  {dataset.is_public ? <Globe className="w-4 h-4 text-blue-600" /> : <EyeOff className="w-4 h-4 text-amber-600" />}
                  {dataset.is_public
                    ? "This dataset is visible to anyone with the link."
                    : "This dataset is private and only visible to its owner."}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "discussions" ? (
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Discussions</h2>
            <p className="text-gray-600">
              Discussion threads are not wired up yet, but this tab is in place for dataset questions, change notes, and feedback.
            </p>
          </div>
        ) : null}

        {activeTab === "settings" && isOwner ? (
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-gray-900">Dataset settings</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={settingsForm.subtitle}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Short one-line summary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail image URL</label>
                <input
                  type="text"
                  value={settingsForm.dataset_thumbnail}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, dataset_thumbnail: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows={6}
                value={settingsForm.description}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Dataset description"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <input
                  type="text"
                  value={settingsForm.tags}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, tags: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="climate, zimbabwe, agriculture"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Authors</label>
                <input
                  type="text"
                  value={settingsForm.authors}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, authors: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Jane Doe, John Doe"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                <input
                  type="text"
                  value={settingsForm.source}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, source: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Institution or project source"
                />
              </div>
              <label className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                {settingsForm.is_public ? <Globe className="w-4 h-4 text-blue-600" /> : <Lock className="w-4 h-4 text-amber-600" />}
                <span className="text-sm text-gray-800">Publicly visible</span>
                <input
                  type="checkbox"
                  checked={settingsForm.is_public}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, is_public: e.target.checked }))}
                  className="ml-auto h-4 w-4"
                />
              </label>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void handleSaveSettings()}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 font-medium disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </PlatformLayout>
  );
}
