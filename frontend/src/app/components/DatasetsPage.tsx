import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Download, Database, Search, Filter } from "lucide-react";

import { PlatformLayout } from "./PlatformLayout";
import { buildDatasetPath, fetchDatasets, requestDatasetDownloadUrl, Dataset } from "../api/datasetApi";

const normalizeCategory = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export function DatasetsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDatasets = async () => {
      try {
        const data = await fetchDatasets();
        if (cancelled) return;
        setDatasets(data.filter((dataset) => dataset.is_public));
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Failed to load datasets.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDatasets();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = [
    { id: "all", name: "All Datasets", count: datasets.length },
    ...Array.from(new Map(
      datasets.map((dataset) => {
        const id = normalizeCategory(dataset.category);
        return [id, { id, name: dataset.category, count: datasets.filter((item) => normalizeCategory(item.category) === id).length }];
      })
    ).values()),
  ];

  const filteredDatasets = datasets.filter((dataset) => {
    const matchesCategory = selectedCategory === "all" || normalizeCategory(dataset.category) === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleDownload = async (datasetId: number) => {
    setDownloadingId(datasetId);
    try {
      const { url } = await requestDatasetDownloadUrl(datasetId);
      window.location.assign(url);
    } catch {
      setError("Failed to prepare the download.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <PlatformLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Datasets</h1>
          <p className="text-gray-600">
            Explore community datasets published on SABHUKU AI.
          </p>
        </div>

        {error ? (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>
        ) : null}

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search datasets by name, description, or tag..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-600">
              <Filter className="w-5 h-5" />
              {filteredDatasets.length} shown
            </div>
          </div>

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

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredDatasets.map((dataset) => (
              <div
                key={dataset.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3 gap-4">
                  <div className="flex-1 min-w-0">
                    <Link to={buildDatasetPath(dataset)} className="block">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-green-700 transition-colors">
                        {dataset.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 mb-1">@{dataset.author_public_username}</p>
                    {dataset.subtitle ? <p className="text-sm text-gray-500">{dataset.subtitle}</p> : null}
                  </div>
                  <Database className="w-6 h-6 text-green-600 shrink-0" />
                </div>

                <p className="text-gray-700 mb-4 line-clamp-3">{dataset.description || "No description yet."}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm gap-4">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium text-gray-900 text-right">{dataset.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm gap-4">
                    <span className="text-gray-600">Format:</span>
                    <div className="flex flex-wrap justify-end gap-2">
                      {dataset.format.map((fmt) => (
                        <span key={fmt} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm gap-4">
                    <span className="text-gray-600">License:</span>
                    <span className="text-gray-900 text-right">{dataset.license}</span>
                  </div>
                </div>

                {dataset.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {dataset.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 gap-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      {dataset.downloads.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={buildDatasetPath(dataset)}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      View details
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDownload(dataset.id)}
                      disabled={downloadingId === dataset.id}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-60"
                    >
                      {downloadingId === dataset.id ? "Preparing..." : "Download"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredDatasets.length === 0 ? (
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
        ) : null}
      </div>
    </PlatformLayout>
  );
}
