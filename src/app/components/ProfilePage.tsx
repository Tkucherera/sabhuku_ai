import { useState } from "react";
import { PlatformLayout } from "./PlatformLayout";
import { User, Mail, MapPin, Calendar, Award, TrendingUp, Settings, LogOut } from "lucide-react";
import { Link } from "react-router";

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = [
    { label: "Models Published", value: 12, icon: TrendingUp, color: "blue" },
    { label: "Datasets Shared", value: 8, icon: TrendingUp, color: "green" },
    { label: "Total Downloads", value: "24.5k", icon: TrendingUp, color: "orange" },
    { label: "Certificates", value: 5, icon: Award, color: "purple" },
  ];

  const activities = [
    {
      id: 1,
      type: "model",
      action: "Published a new model",
      title: "Shona-GPT-7B",
      time: "2 days ago",
    },
    {
      id: 2,
      type: "course",
      action: "Completed course",
      title: "Introduction to AI for Africa",
      time: "5 days ago",
    },
    {
      id: 3,
      type: "dataset",
      action: "Uploaded dataset",
      title: "Zimbabwe Census 2022",
      time: "1 week ago",
    },
    {
      id: 4,
      type: "certificate",
      action: "Earned certificate",
      title: "NLP for African Languages",
      time: "2 weeks ago",
    },
  ];

  return (
    <PlatformLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-6">
              <div className="flex items-end gap-6">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
                  JD
                </div>
                <div className="pb-2">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">John Doe</h1>
                  <p className="text-gray-600">AI Researcher & Data Scientist</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </button>
                <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">john.doe@example.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Harare, Zimbabwe</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Joined March 2025</span>
              </div>
            </div>

            <p className="text-gray-700 max-w-3xl">
              Passionate about developing AI solutions for African challenges. Specializing in NLP for local
              languages and computer vision applications for wildlife conservation. Active contributor to the
              SADC AI community.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-4 px-2 font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("models")}
            className={`pb-4 px-2 font-medium border-b-2 transition-colors ${
              activeTab === "models"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Models (12)
          </button>
          <button
            onClick={() => setActiveTab("datasets")}
            className={`pb-4 px-2 font-medium border-b-2 transition-colors ${
              activeTab === "datasets"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Datasets (8)
          </button>
          <button
            onClick={() => setActiveTab("certificates")}
            className={`pb-4 px-2 font-medium border-b-2 transition-colors ${
              activeTab === "certificates"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Certificates (5)
          </button>
        </div>

        {/* Content Area */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          activity.type === "model"
                            ? "bg-blue-100 text-blue-600"
                            : activity.type === "course"
                            ? "bg-purple-100 text-purple-600"
                            : activity.type === "dataset"
                            ? "bg-green-100 text-green-600"
                            : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {activity.type === "model" ? "🤖" : activity.type === "course" ? "📚" : activity.type === "dataset" ? "📊" : "🏆"}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 mb-1">
                          {activity.action}{" "}
                          <span className="font-bold text-gray-900">{activity.title}</span>
                        </p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Skills & Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {["Natural Language Processing", "Computer Vision", "Deep Learning", "Python", "TensorFlow", "PyTorch", "Data Analysis", "Machine Learning"].map((skill) => (
                  <span key={skill} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Badges</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div className="text-xs text-gray-600">Early Adopter</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-xs text-gray-600">Top Contributor</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-xs text-gray-600">Mentor</div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Connect</h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    🐦
                  </div>
                  <span>Twitter</span>
                </a>
                <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    💼
                  </div>
                  <span>LinkedIn</span>
                </a>
                <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    🐙
                  </div>
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}
