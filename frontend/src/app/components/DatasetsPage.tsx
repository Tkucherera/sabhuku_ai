import { useState } from "react";
import { PlatformLayout } from "./PlatformLayout";
import { Download, FileText, Database, Search, Filter } from "lucide-react";

export function DatasetsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", name: "All Datasets", count: 1234 },
    { id: "text", name: "Text", count: 456 },
    { id: "image", name: "Image", count: 289 },
    { id: "audio", name: "Audio", count: 123 },
    { id: "tabular", name: "Tabular", count: 366 },
  ];

  const datasets = [
    {
      id: 1,
      name: "Zimbabwe Census 2022",
      author: "Zimbabwe Statistical Agency",
      description: "Comprehensive demographic, economic, and social data from the 2022 national census. Includes population distribution, household characteristics, employment, education, and health statistics.",
      category: "tabular",
      size: "2.4 GB",
      downloads: 5234,
      format: ["CSV", "JSON", "Excel"],
      updated: "1 week ago",
      license: "Open Data License",
    },
    {
      id: 2,
      name: "SADC Languages Corpus",
      author: "Pan-African Language Initiative",
      description: "Extensive text corpus covering 16 Southern African languages including Shona, Ndebele, Zulu, Xhosa, and more. Over 10 million sentences across various domains.",
      category: "text",
      size: "8.7 GB",
      downloads: 3821,
      format: ["TXT", "JSON"],
      updated: "2 weeks ago",
      license: "CC BY-SA 4.0",
    },
    {
      id: 3,
      name: "Zimbabwe Landmarks Dataset",
      author: "Tourism Zimbabwe",
      description: "High-quality images of Zimbabwean landmarks, national parks, and cultural sites. Includes 50,000+ annotated images with GPS coordinates and descriptions.",
      category: "image",
      size: "15.3 GB",
      downloads: 2567,
      format: ["JPEG", "PNG", "Annotations"],
      updated: "3 days ago",
      license: "CC BY-NC 4.0",
    },
    {
      id: 4,
      name: "SADC Economic Indicators",
      author: "SADC Secretariat",
      description: "Historical economic data for all 16 SADC member states. Covers GDP, inflation, trade, investment, and development indicators from 1990-2026.",
      category: "tabular",
      size: "850 MB",
      downloads: 4123,
      format: ["CSV", "Excel", "SQL"],
      updated: "5 days ago",
      license: "Open Data License",
    },
    {
      id: 5,
      name: "Shona-English Parallel Corpus",
      author: "Language Tech Africa",
      description: "Parallel translation dataset with 500,000 aligned sentence pairs in Shona and English. Ideal for training machine translation models.",
      category: "text",
      size: "1.2 GB",
      downloads: 3456,
      format: ["TXT", "TMX", "JSON"],
      updated: "1 week ago",
      license: "CC BY 4.0",
    },
    {
      id: 6,
      name: "Zimbabwe Wildlife Audio",
      author: "Conservation Sounds Africa",
      description: "Audio recordings of wildlife vocalizations from Zimbabwean national parks. Includes elephants, lions, birds, and other species with species labels.",
      category: "audio",
      size: "6.5 GB",
      downloads: 1890,
      format: ["WAV", "MP3", "Metadata"],
      updated: "2 days ago",
      license: "CC BY-NC-SA 4.0",
    },
  ];

  const filteredDatasets = datasets.filter((dataset) => {
    const matchesCategory = selectedCategory === "all" || dataset.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PlatformLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Datasets</h1>
          <p className="text-gray-600">
            Access curated datasets for Zimbabwe and the SADC region
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
                placeholder="Search datasets by name or description..."
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
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* Datasets Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredDatasets.map((dataset) => (
            <div
              key={dataset.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{dataset.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">{dataset.author}</p>
                </div>
                <Database className="w-6 h-6 text-green-600" />
              </div>

              <p className="text-gray-700 mb-4">{dataset.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium text-gray-900">{dataset.size}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Format:</span>
                  <div className="flex gap-2">
                    {dataset.format.map((fmt) => (
                      <span key={fmt} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">License:</span>
                  <span className="text-gray-900">{dataset.license}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    {dataset.downloads.toLocaleString()}
                  </span>
                  <span className="text-gray-500">• {dataset.updated}</span>
                </div>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDatasets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No datasets found matching your criteria.</p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
