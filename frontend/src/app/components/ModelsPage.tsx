import { useState } from "react";
import { PlatformLayout } from "./PlatformLayout";
import { Star, Download, TrendingUp, Filter, Search } from "lucide-react";

import { useModels } from "../../hooks/useModels";
import { Model } from "../../types";


export function ModelsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const {data, loading } = useModels();

  if (loading) return <p>Loading</p>;

  


  const categories = [
    { id: "all", name: "All Models", count: 487 },
    { id: "nlp", name: "NLP", count: 156 },
    { id: "cv", name: "Computer Vision", count: 98 },
    { id: "audio", name: "Audio", count: 45 },
    { id: "multimodal", name: "Multimodal", count: 67 },
  ];



  const models: Array<Model> = data;
  /*
  [
    {
      id: 1,
      name: "Shona-GPT-7B",
      author: "SADC Research Lab",
      description: "A large language model specifically trained on Shona language corpus with 7 billion parameters. Excellent for text generation, translation, and understanding Shona content.",
      category: "nlp",
      downloads: 12543,
      likes: 234,
      trending: true,
      tags: ["language-model", "shona", "text-generation"],
      updated: "2 days ago",
    },
    {
      id: 2,
      name: "Zimbabwe-Vision-Classifier",
      author: "AI Zimbabwe",
      description: "State-of-the-art image classification model trained on Zimbabwean landmarks, wildlife, and urban scenes. Achieves 94% accuracy on local imagery.",
      category: "cv",
      downloads: 8342,
      likes: 189,
      trending: true,
      tags: ["image-classification", "zimbabwe", "landmarks"],
      updated: "5 days ago",
    },
    {
      id: 3,
      name: "SADC-NER-Model",
      author: "Regional AI Collective",
      description: "Named Entity Recognition model optimized for Southern African contexts, including local names, places, and organizations across 16 SADC countries.",
      category: "nlp",
      downloads: 6789,
      likes: 156,
      trending: false,
      tags: ["ner", "sadc", "entity-recognition"],
      updated: "1 week ago",
    },
    {
      id: 4,
      name: "Ndebele-Speech-Recognition",
      author: "Language Tech Africa",
      description: "Automatic speech recognition system for Ndebele language with support for various dialects spoken across Zimbabwe and neighboring regions.",
      category: "audio",
      downloads: 5234,
      likes: 142,
      trending: false,
      tags: ["speech-recognition", "ndebele", "audio"],
      updated: "2 weeks ago",
    },
    {
      id: 5,
      name: "African-Wildlife-Detector",
      author: "Conservation AI",
      description: "Object detection model specialized in identifying African wildlife species from camera trap images. Supports 50+ species common in SADC region.",
      category: "cv",
      downloads: 4567,
      likes: 128,
      trending: true,
      tags: ["object-detection", "wildlife", "conservation"],
      updated: "3 days ago",
    },
    {
      id: 6,
      name: "Bantu-Languages-Translator",
      author: "Pan-African NLP",
      description: "Multi-language neural machine translation model covering major Bantu languages including Shona, Ndebele, Zulu, and Swahili.",
      category: "nlp",
      downloads: 9876,
      likes: 267,
      trending: true,
      tags: ["translation", "bantu-languages", "multilingual"],
      updated: "1 day ago",
    },
  ];
  */

  const filteredModels = models.filter((model) => {
    const matchesCategory = selectedCategory === "all" || model.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PlatformLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Models</h1>
          <p className="text-gray-600">
            Discover and deploy pre-trained models for Zimbabwe and the SADC region
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models by name, description, or tags..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredModels.map((model) => (
            <div
              key={model.id.toString()}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{model.name}</h3>
                    {model.trending && (
                      <span className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                        <TrendingUp className="w-3 h-3" />
                        Trending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{model.author.toString()}</p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Star className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <p className="text-gray-700 mb-4">{model.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {model.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    {model.downloads.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {model.likes.toString()}
                  </span>
                  <span className="text-gray-500">• {model.updated}</span>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                  View Model
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredModels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No models found matching your criteria.</p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
