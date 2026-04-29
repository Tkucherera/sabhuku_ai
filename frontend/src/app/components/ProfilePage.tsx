import { useEffect, useRef, useState } from "react";
import { PlatformLayout } from "./PlatformLayout";
import { Mail, MapPin, Calendar, Settings, LogOut, Save, X, Upload, Plus, Trash2, ExternalLink, Box, Database, TrendingUp, Image as ImageIcon, Loader2, AtSign, FilePenLine } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "./AuthContext";
import { getProfile, requestProfileImageUploadUrl, updateProfile, uploadProfileImageToStorage, ProfileData } from "../api/authApi";
import { UploadModelModal, UploadedModel } from "./UploadModelModal";
import { UploadDatasetModal, UploadedDataset } from "./UploadDatasetModal";
import { fetchModels } from "../api/modelApi";
import { buildDatasetPath, fetchDatasets, Dataset as BackendDataset } from "../api/datasetApi";
import { Model as BackendModel } from "../../types";



type FullProfile = ProfileData & { username: string; email: string; date_joined: string };
type UploadTarget = "model" | "dataset" | null;

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently"
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getFileNameFromPath = (filePath: string) => filePath.split("/").pop() || filePath;

const mapModelToUploadCard = (model: BackendModel): UploadedModel => ({
  id: String(model.id),
  name: model.name,
  description: model.description,
  category: model.category,
  tags: model.tags.join(", "),
  fileName: getFileNameFromPath(model.file_path),
  fileSize: "Stored in GCS",
  uploadedAt: formatTimestamp(model.updated),
});

const mapDatasetToUploadCard = (dataset: BackendDataset): UploadedDataset => ({
  id: String(dataset.id),
  name: dataset.name,
  description: dataset.description,
  category: dataset.category,
  license: dataset.license,
  tags: dataset.tags.join(", "),
  fileName: getFileNameFromPath(dataset.file_path),
  fileSize: dataset.size,
  uploadedAt: formatTimestamp(dataset.updated),
  path: buildDatasetPath(dataset),
});

const buildInitials = (profile: FullProfile | null) => {
  const first = profile?.first_name?.trim()?.[0] ?? "";
  const last = profile?.last_name?.trim()?.[0] ?? "";
  const fallback = profile?.username?.trim()?.slice(0, 2) ?? "??";
  return `${first}${last}`.trim().toUpperCase() || fallback.toUpperCase();
};

export function ProfilePage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [form, setForm] = useState<ProfileData>({
    public_username: "",
    first_name: "",
    last_name: "",
    bio: "",
    location: "",
    title: "",
    avatar_path: "",
    avatar_url: "",
    cover_image_path: "",
    cover_image_url: "",
    twitter: "",
    linkedin: "",
    github: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadTarget, setUploadTarget] = useState<UploadTarget>(null);
  const [models, setModels] = useState<UploadedModel[]>([]);
  const [datasets, setDatasets] = useState<UploadedDataset[]>([]);
  const [imageUploadState, setImageUploadState] = useState<{ avatar: boolean; cover: boolean }>({
    avatar: false,
    cover: false,
  });
  const [imagePreviewUrls, setImagePreviewUrls] = useState<{ avatar: string; cover: string }>({
    avatar: "",
    cover: "",
  });
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfilePage = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const profileData = await getProfile(token);
        if (cancelled) return;

        setProfile(profileData);
        setForm({
          public_username: profileData.public_username,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          bio: profileData.bio,
          location: profileData.location,
          title: profileData.title,
          avatar_path: profileData.avatar_path || "",
          avatar_url: profileData.avatar_url,
          cover_image_path: profileData.cover_image_path || "",
          cover_image_url: profileData.cover_image_url,
          twitter: profileData.twitter,
          linkedin: profileData.linkedin,
          github: profileData.github,
        });
        setImagePreviewUrls({ avatar: "", cover: "" });

        const [allModels, allDatasets] = await Promise.all([fetchModels(), fetchDatasets()]);
        if (cancelled) return;

        setModels(
          allModels
            .filter((model) => model.author_username === profileData.username)
            .map(mapModelToUploadCard)
        );
        setDatasets(
          allDatasets
            .filter((dataset) => dataset.author_username === profileData.username)
            .map(mapDatasetToUploadCard)
        );
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Failed to load profile data. Try reauthenticating.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfilePage();

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  const refreshUserUploads = async () => {
    if (!profile?.username) return;

    const [allModels, allDatasets] = await Promise.all([fetchModels(), fetchDatasets()]);

    setModels(
      allModels
        .filter((model) => model.author_username === profile.username)
        .map(mapModelToUploadCard)
    );
    setDatasets(
      allDatasets
        .filter((dataset) => dataset.author_username === profile.username)
        .map(mapDatasetToUploadCard)
    );
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const payload: Partial<ProfileData> = {
        ...form,
        public_username: form.public_username.trim(),
      };

      if (!payload.public_username) {
        delete payload.public_username;
      }

      const updated = await updateProfile(token, payload);
      setProfile((prev) => prev ? { ...prev, ...payload, ...updated } : prev);
      setImagePreviewUrls({ avatar: "", cover: "" });
      setEditing(false);
      setError(null);
    } catch { setError("Failed to save profile"); }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        public_username: profile.public_username,
        first_name: profile.first_name,
        last_name: profile.last_name,
        bio: profile.bio,
        location: profile.location,
        title: profile.title,
        avatar_path: profile.avatar_path || "",
        avatar_url: profile.avatar_url,
        cover_image_path: profile.cover_image_path || "",
        cover_image_url: profile.cover_image_url,
        twitter: profile.twitter,
        linkedin: profile.linkedin,
        github: profile.github,
      });
    }
    setImagePreviewUrls({ avatar: "", cover: "" });
    setEditing(false);
    setError(null);
  };

  const handleProfileImageSelected = async (target: "avatar" | "cover", file: File | null) => {
    if (!file || !token) return;

    setImageUploadState((prev) => ({ ...prev, [target]: true }));
    setError(null);

    try {
      const contentType = file.type || "application/octet-stream";
      const previewUrl = URL.createObjectURL(file);
      const { upload_url, file_path } = await requestProfileImageUploadUrl(token, file.name, contentType);
      await uploadProfileImageToStorage(upload_url, file, contentType);

      setImagePreviewUrls((prev) => ({
        ...prev,
        [target]: previewUrl,
      }));
      setForm((prev) => ({
        ...prev,
        [target === "avatar" ? "avatar_path" : "cover_image_path"]: file_path,
        [target === "avatar" ? "avatar_url" : "cover_image_url"]: "",
      }));
    } catch (uploadError) {
      if (uploadError instanceof Error) {
        setError(uploadError.message);
      } else {
        setError(`Failed to upload ${target} image`);
      }
    } finally {
      setImageUploadState((prev) => ({ ...prev, [target]: false }));
    }
  };

  const initials = buildInitials(profile);
  const displayName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || profile?.username || "—";
  const joinedDate = profile?.date_joined
    ? new Date(profile.date_joined).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";
  const visibleAvatarUrl = editing ? imagePreviewUrls.avatar || form.avatar_url : profile?.avatar_url;
  const visibleCoverImageUrl = editing ? imagePreviewUrls.cover || form.cover_image_url : profile?.cover_image_url;

  if (loading) return (
    <PlatformLayout>
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    </PlatformLayout>
  );

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "models", label: "Models", count: models.length },
    { id: "datasets", label: "Datasets", count: datasets.length },
    { id: "social", label: "Social" },
  ];

  return (
    <PlatformLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6 shadow-sm">
          <div className="relative h-44 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700">
            {visibleCoverImageUrl ? (
              <img
                src={visibleCoverImageUrl}
                alt={`${displayName} cover`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
            />
            <div className="absolute inset-0 bg-slate-950/15" />
          </div>
          <div className="relative px-8 pb-8">
            <div className="relative z-20 flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-6">
              <div className="flex items-end gap-5">
                <div className="relative z-20 w-28 h-28 rounded-2xl border-4 border-white shadow-lg shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                  {visibleAvatarUrl ? (
                    <img
                      src={visibleAvatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white text-3xl font-bold">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="pb-1">
                  {editing ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="First name"
                        value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      />
                      <input
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Last name"
                        value={form.last_name}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      />
                    </div>
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                  )}
              
                  {editing
                    ? <input className="mt-3 border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-full md:w-72 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your title e.g. AI Researcher" value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    : <p className="text-gray-500 mt-0.5">{profile?.title || "No title set"}</p>
                  }
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                {editing ? (
                  <>
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-60">
                      <Save className="w-4 h-4" />{saving ? "Saving..." : "Save changes"}
                    </button>
                    <button onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium">
                      <X className="w-4 h-4" />Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setUploadTarget("model")}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium">
                      <Upload className="w-4 h-4" />Upload Model
                    </button>
                    <button onClick={() => setUploadTarget("dataset")}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium">
                      <Upload className="w-4 h-4" />Upload Dataset
                    </button>
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium">
                      <Settings className="w-4 h-4" />Edit
                    </button>
                    <Link to="/" onClick={logout}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 text-sm font-medium">
                      <LogOut className="w-4 h-4" />Logout
                    </Link>
                  </>
                )}
              </div>
            </div>

              <div className="flex flex-wrap gap-6 mb-5 text-sm text-gray-600">
              <div className="flex items-center gap-2"><AtSign className="w-4 h-4 text-gray-400" /><span>{profile?.public_username ?? "—"}</span></div>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span>{profile?.email ?? "—"}</span></div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                {editing
                  ? <input className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City, Country" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  : <span>{profile?.location || "No location set"}</span>}
              </div>
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /><span>Joined {joinedDate}</span></div>
            </div>

            {editing ? (
              <div className="space-y-4 max-w-3xl">
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <AtSign className="w-4 h-4" />
                    Public username
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your-public-handle"
                    value={form.public_username}
                    onChange={(e) => setForm({ ...form, public_username: e.target.value })}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                      <ImageIcon className="w-4 h-4" />
                      Avatar image
                    </label>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        void handleProfileImageSelected("avatar", e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={imageUploadState.avatar}
                      className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-xl px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {imageUploadState.avatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {imageUploadState.avatar ? "Uploading avatar..." : "Choose avatar image"}
                    </button>
                    {form.avatar_url ? (
                      <p className="mt-2 text-xs text-gray-500 truncate">{form.avatar_url}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                      <ImageIcon className="w-4 h-4" />
                      Cover image
                    </label>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        void handleProfileImageSelected("cover", e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={imageUploadState.cover}
                      className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-xl px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {imageUploadState.cover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {imageUploadState.cover ? "Uploading cover..." : "Choose cover image"}
                    </button>
                    {form.cover_image_url ? (
                      <p className="mt-2 text-xs text-gray-500 truncate">{form.cover_image_url}</p>
                    ) : null}
                  </div>
                </div>
                <textarea className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm max-w-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3} placeholder="Write a short bio..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
            ) : (
              <p className="text-gray-600 max-w-2xl text-sm leading-relaxed">{profile?.bio || "No bio yet — click Edit to add one."}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Models", value: models.length, icon: Box, color: "blue" },
            { label: "Datasets", value: datasets.length, icon: Database, color: "green" },
            { label: "Downloads", value: "—", icon: TrendingUp, color: "orange" },
            { label: "Contributions", value: models.length + datasets.length, icon: TrendingUp, color: "purple" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className={`w-8 h-8 rounded-lg bg-${s.color}-100 flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 text-${s.color}-600`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button onClick={() => setUploadTarget("model")} className="text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium">
              + Upload Model
            </button>
            <button onClick={() => setUploadTarget("dataset")} className="text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium">
              + Add Dataset
            </button>
            <Link to="/tutorials/studio/new" className="px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium">
              <span className="inline-flex items-center gap-2">
                <FilePenLine className="h-4 w-4" />
                Write Tutorial
              </span>
            </Link>
            <Link to="/learning?status=draft" className="px-4 py-3 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 font-medium">
              View My Drafts
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab.id ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab.id === "models" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Recent Models</h3>
                <button onClick={() => setActiveTab("models")} className="text-xs text-blue-600 hover:text-blue-700">View all →</button>
              </div>
              {models.length === 0
                ? <div className="text-center py-6">
                    <Box className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm mb-3">No models yet</p>
                    <button onClick={() => setUploadTarget("model")} className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                      <Plus className="w-3.5 h-3.5" />Upload Model
                    </button>
                  </div>
                : models.slice(0, 2).map((m) => (
                    <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0"><Box className="w-4 h-4 text-blue-600" /></div>
                      <div className="min-w-0"><p className="font-medium text-sm text-gray-900 truncate">{m.name}</p><p className="text-xs text-gray-400">{m.category} · {m.fileSize}</p></div>
                    </div>
                  ))
              }
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Recent Datasets</h3>
                <button onClick={() => setActiveTab("datasets")} className="text-xs text-green-600 hover:text-green-700">View all →</button>
              </div>
              {datasets.length === 0
                ? <div className="text-center py-6">
                    <Database className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm mb-3">No datasets yet</p>
                    <button onClick={() => setUploadTarget("dataset")} className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium">
                      <Plus className="w-3.5 h-3.5" />Upload Dataset
                    </button>
                  </div>
                : datasets.slice(0, 2).map((d) => (
                    <div key={d.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0"><Database className="w-4 h-4 text-green-600" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900 truncate">{d.name}</p>
                        <p className="text-xs text-gray-400">{d.category} · {d.fileSize}</p>
                      </div>
                      {d.path ? (
                        <Link to={d.path} className="text-xs font-medium text-green-600 hover:text-green-700">
                          View
                        </Link>
                      ) : null}
                    </div>
                  ))
              }
            </div>
          </div>
        )}

        {/* Models tab */}
        {activeTab === "models" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Your Models ({models.length})</h2>
              <button onClick={() => setUploadTarget("model")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium">
                <Plus className="w-4 h-4" />Upload Model
              </button>
            </div>
            {models.length === 0
              ? <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                  <Box className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No models uploaded yet</p>
                  <button onClick={() => setUploadTarget("model")} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium">
                    <Upload className="w-4 h-4" />Upload your first model
                  </button>
                </div>
              : <div className="grid md:grid-cols-2 gap-4">
                  {models.map((model) => (
                    <div key={model.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Box className="w-5 h-5 text-blue-600" /></div>
                        <button onClick={() => setModels((prev) => prev.filter((m) => m.id !== model.id))}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{model.name}</h3>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{model.description || "No description"}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">{model.category}</span>
                        {model.tags.split(",").filter(Boolean).slice(0, 2).map((t) => (
                          <span key={t.trim()} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">{t.trim()}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-400">
                        <span>{model.fileName} · {model.fileSize}</span><span>{model.uploadedAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* Datasets tab */}
        {activeTab === "datasets" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Your Datasets ({datasets.length})</h2>
              <button onClick={() => setUploadTarget("dataset")} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium">
                <Plus className="w-4 h-4" />Upload Dataset
              </button>
            </div>
            {datasets.length === 0
              ? <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                  <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No datasets uploaded yet</p>
                  <button onClick={() => setUploadTarget("dataset")} className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium">
                    <Upload className="w-4 h-4" />Upload your first dataset
                  </button>
                </div>
              : <div className="grid md:grid-cols-2 gap-4">
                  {datasets.map((dataset) => (
                    <div key={dataset.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><Database className="w-5 h-5 text-green-600" /></div>
                        <button onClick={() => setDatasets((prev) => prev.filter((d) => d.id !== dataset.id))}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{dataset.name}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">{dataset.category}</span>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">{dataset.license}</span>
                        {dataset.tags.split(",").filter(Boolean).slice(0, 1).map((t) => (
                          <span key={t.trim()} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">{t.trim()}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-400">
                        <span>{dataset.fileName} · {dataset.fileSize}</span><span>{dataset.uploadedAt}</span>
                      </div>
                      {dataset.path ? (
                        <div className="mt-4 flex items-center gap-3">
                          <Link
                            to={dataset.path}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700"
                          >
                            View dataset
                          </Link>
                          <Link
                            to={`${dataset.path}?tab=settings`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
                          >
                            Edit dataset
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* Social tab */}
        {activeTab === "social" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-md">
            <h3 className="font-bold text-gray-900 mb-5">Social Links</h3>
            {editing ? (
              <div className="space-y-3">
                {[
                  { key: "twitter", icon: "🐦", placeholder: "Twitter handle (without @)" },
                  { key: "linkedin", icon: "💼", placeholder: "LinkedIn profile URL" },
                  { key: "github", icon: "🐙", placeholder: "GitHub username" },
                ].map(({ key, icon, placeholder }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-8 text-center text-lg">{icon}</span>
                    <input className="border border-gray-300 rounded-xl px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={placeholder} value={form[key as keyof ProfileData]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { icon: "🐦", label: "Twitter", href: profile?.twitter ? `https://twitter.com/${profile.twitter}` : null, display: profile?.twitter ? `@${profile.twitter}` : null },
                  { icon: "💼", label: "LinkedIn", href: profile?.linkedin || null, display: profile?.linkedin ? "View Profile" : null },
                  { icon: "🐙", label: "GitHub", href: profile?.github ? `https://github.com/${profile.github}` : null, display: profile?.github || null },
                ].map(({ icon, label, href, display }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <span className="text-lg">{icon}</span>
                    {href
                      ? <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium">
                          {display}<ExternalLink className="w-3 h-3" />
                        </a>
                      : <span className="text-gray-400 text-sm">{label} — not set</span>
                    }
                  </div>
                ))}
                <button onClick={() => setEditing(true)} className="w-full mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium py-2">Edit social links →</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {uploadTarget === "model" && (
        <UploadModelModal
          onClose={() => setUploadTarget(null)}
          onUploaded={async () => {
            await refreshUserUploads();
            setUploadTarget(null);
            setActiveTab("models");
          }}
        />
      )}
      {uploadTarget === "dataset" && (
        <UploadDatasetModal
          onClose={() => setUploadTarget(null)}
          onUploaded={async () => {
            await refreshUserUploads();
            setUploadTarget(null);
            setActiveTab("datasets");
          }}
        />
      )}
    </PlatformLayout>
  );
}
