import { PlatformLayout } from "./PlatformLayout";
import { TrendingUp, Users, Star, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function Dashboard() {

  

  const recentModels = [
    {
      id: 1,
      name: "Shona-GPT-7B",
      description: "Language model trained on Shona language corpus",
      author: "SADC Research Lab",
      downloads: "12.5k",
      likes: 234,
      updated: "2 days ago",
    },
    {
      id: 2,
      name: "Zimbabwe-Vision-Classifier",
      description: "Image classification for Zimbabwean landmarks and wildlife",
      author: "AI Zimbabwe",
      downloads: "8.3k",
      likes: 189,
      updated: "5 days ago",
    },
    {
      id: 3,
      name: "SADC-NER-Model",
      description: "Named Entity Recognition for Southern African contexts",
      author: "Regional AI Collective",
      downloads: "6.7k",
      likes: 156,
      updated: "1 week ago",
    },
  ];

  const recentDatasets = [
    {
      id: 1,
      name: "Zimbabwe Census 2022",
      description: "Comprehensive demographic and economic data",
      size: "2.4 GB",
      downloads: "5.2k",
      updated: "1 week ago",
    },
    {
      id: 2,
      name: "SADC Languages Corpus",
      description: "Text corpus covering 16 Southern African languages",
      size: "8.7 GB",
      downloads: "3.8k",
      updated: "2 weeks ago",
    },
  ];

  const learningPaths = [
    {
      id: 1,
      title: "Introduction to AI for Africa",
      lessons: 12,
      duration: "4 hours",
      difficulty: "Beginner",
    },
    {
      id: 2,
      title: "Building NLP Models with African Languages",
      lessons: 18,
      duration: "8 hours",
      difficulty: "Intermediate",
    },
  ];

  return (
    <PlatformLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, John! 👋</h1>
          <p className="text-blue-100 mb-6">
            Explore the latest AI models and datasets for Zimbabwe and the SADC region.
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Your Models</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">12</div>
            <div className="text-sm text-green-600 mt-1">+2 this month</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Datasets</span>
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">8</div>
            <div className="text-sm text-green-600 mt-1">+1 this month</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Downloads</span>
              <Star className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">24.5k</div>
            <div className="text-sm text-green-600 mt-1">+3.2k this month</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Courses Completed</span>
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">5</div>
            <div className="text-sm text-gray-600 mt-1">3 in progress</div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Trending Models */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Trending Models</h2>
                <Link to="/models" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
                {recentModels.map((model) => (
                  <div key={model.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">{model.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {model.author}
                          </span>
                          <span>↓ {model.downloads}</span>
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {model.likes}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{model.updated}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Datasets */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Popular Datasets</h2>
                <Link to="/datasets" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
                {recentDatasets.map((dataset) => (
                  <div key={dataset.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <h3 className="font-bold text-gray-900 mb-1">{dataset.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{dataset.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{dataset.size}</span>
                      <span>↓ {dataset.downloads}</span>
                      <span>Updated {dataset.updated}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Learning Paths */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Continue Learning</h2>
              </div>
              <div className="p-6 space-y-4">
                {learningPaths.map((path) => (
                  <div key={path.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
                    <h3 className="font-bold text-gray-900 mb-2">{path.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span>{path.lessons} lessons</span>
                      <span>•</span>
                      <span>{path.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {path.difficulty}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
                <Link
                  to="/learning"
                  className="block text-center text-blue-600 hover:text-blue-700 font-medium text-sm pt-2"
                >
                  View all courses →
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium">
                  + Upload Model
                </button>
                <button className="w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium">
                  + Add Dataset
                </button>
                <button className="w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium">
                  + Create Project
                </button>
              </div>
            </div>

            {/* Community Stats */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
              <h3 className="font-bold mb-4">Community Impact</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-2xl font-bold">5,234</div>
                  <div className="text-blue-100 text-sm">Active Members</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">1,456</div>
                  <div className="text-blue-100 text-sm">Projects Created</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">89%</div>
                  <div className="text-blue-100 text-sm">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}
