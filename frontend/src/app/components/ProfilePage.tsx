import { useState, useEffect } from "react";
import { PlatformLayout } from "./PlatformLayout";
import { User, Mail, MapPin, Calendar, Award, TrendingUp, Settings, LogOut, Save, X } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "./AuthContext";
import { getProfile, updateProfile, ProfileData } from "../api/authApi";

type FullProfile = ProfileData & { username: string; email: string; date_joined: string };

export function ProfilePage() {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [form, setForm] = useState<ProfileData>({ bio: "", location: "", title: "", twitter: "", linkedin: "", github: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
      
      getProfile(token)
    
      .then((data) => {
        setProfile(data);
        setForm({ bio: data.bio, location: data.location, title: data.title, twitter: data.twitter, linkedin: data.linkedin, github: data.github });
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await updateProfile(token, form);
      setProfile((prev) => prev ? { ...prev, ...updated } : prev);
      setEditing(false);
    } catch {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) setForm({ bio: profile.bio, location: profile.location, title: profile.title, twitter: profile.twitter, linkedin: profile.linkedin, github: profile.github });
    setEditing(false);
  };

  const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "??";
  const joinedDate = profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

  if (loading) return <PlatformLayout><div className="flex items-center justify-center h-64 text-gray-500">Loading profile...</div></PlatformLayout>;

  return (
    <PlatformLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>}

        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-6">
              <div className="flex items-end gap-6">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
                  {initials}
                </div>
                <div className="pb-2">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{profile?.username ?? "—"}</h1>
                  {editing ? (
                    <input
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-64"
                      placeholder="Your title e.g. AI Researcher"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-600">{profile?.title || "No title set"}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                {editing ? (
                  <>
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Save className="w-4 h-4" />{saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                      <X className="w-4 h-4" />Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    <Settings className="w-4 h-4" />Edit Profile
                  </button>
                )}
                <Link to="/" onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                  <LogOut className="w-4 h-4" />Logout
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{profile?.email ?? "—"}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                {editing ? (
                  <input className="border border-gray-300 rounded px-2 py-1 text-sm flex-1" placeholder="City, Country" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                ) : (
                  <span className="text-gray-700">{profile?.location || "No location set"}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Joined {joinedDate}</span>
              </div>
            </div>

            {editing ? (
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm max-w-3xl"
                rows={3}
                placeholder="Write a short bio about yourself..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            ) : (
              <p className="text-gray-700 max-w-3xl">{profile?.bio || "No bio yet. Click Edit Profile to add one."}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          {["overview", "models", "datasets"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 font-medium border-b-2 capitalize transition-colors ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-gray-500 text-sm">Activity will appear here once you start contributing.</p>
            </div>
          </div>

          {/* Sidebar — Social Links */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Connect</h3>
            <div className="space-y-3">
              {editing ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="w-8 text-center">🐦</span>
                    <input className="border border-gray-300 rounded px-2 py-1 text-sm flex-1" placeholder="Twitter handle" value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 text-center">💼</span>
                    <input className="border border-gray-300 rounded px-2 py-1 text-sm flex-1" placeholder="LinkedIn URL" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 text-center">🐙</span>
                    <input className="border border-gray-300 rounded px-2 py-1 text-sm flex-1" placeholder="GitHub username" value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  {profile?.twitter ? <a href={`https://twitter.com/${profile.twitter}`} target="_blank" className="flex items-center gap-3 text-gray-700 hover:text-blue-600"><span>🐦</span>{profile.twitter}</a> : <span className="text-gray-400 text-sm flex items-center gap-3"><span>🐦</span>Not set</span>}
                  {profile?.linkedin ? <a href={profile.linkedin} target="_blank" className="flex items-center gap-3 text-gray-700 hover:text-blue-600"><span>💼</span>LinkedIn</a> : <span className="text-gray-400 text-sm flex items-center gap-3"><span>💼</span>Not set</span>}
                  {profile?.github ? <a href={`https://github.com/${profile.github}`} target="_blank" className="flex items-center gap-3 text-gray-700 hover:text-blue-600"><span>🐙</span>{profile.github}</a> : <span className="text-gray-400 text-sm flex items-center gap-3"><span>🐙</span>Not set</span>}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}