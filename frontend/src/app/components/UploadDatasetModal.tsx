import { useState, useRef } from "react";
import { X, Upload, Database } from "lucide-react";
import { useAuth } from "./AuthContext";
import { createDataset, requestDatasetUploadUrl, uploadDatasetFileToStorage } from "../api/datasetApi";
import { RichTextEditor } from "./ui/rich-text-editor";

const DATASET_CATEGORIES = ["Tabular", "Text / NLP", "Images", "Audio", "Video", "Geospatial", "Time Series", "Other"];
const LICENSES = ["CC0 (Public Domain)", "CC BY 4.0", "CC BY-SA 4.0", "CC BY-NC 4.0", "Apache 2.0", "MIT", "Custom"];

export interface UploadedDataset {
  id: string;
  name: string;
  description: string;
  category: string;
  license: string;
  tags: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
}

interface Props {
  onClose: () => void;
  onUploaded: (dataset: UploadedDataset) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export function UploadDatasetModal({ onClose, onUploaded }: Props) {
  const { token } = useAuth();
  const [step, setStep] = useState<"details" | "file">("details");
  const [form, setForm] = useState({ name: "", description: "", category: "Tabular", license: "CC0 (Public Domain)", tags: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inferDatasetFormats = (file: File) => {
    const lowerName = file.name.toLowerCase();
    const supportedExtensions = [".tar.gz", ".csv", ".json", ".parquet", ".xlsx", ".zip"];
    const extension = supportedExtensions.find((item) => lowerName.endsWith(item));

    if (extension) {
      return [extension.replace(/^\./, "")];
    }

    const parts = lowerName.split(".");
    return parts.length > 1 ? [parts[parts.length - 1]] : ["unknown"];
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !form.name || !token) return;
    setUploading(true);
    setProgress(0);
    setError(null);

    const interval = setInterval(() => {
      setProgress((p) => { if (p >= 95) { clearInterval(interval); return p; } return p + Math.random() * 15; });
    }, 200);

    try {
      const contentType = selectedFile.type || "application/octet-stream";
      const { upload_url, file_path } = await requestDatasetUploadUrl(token, selectedFile.name, contentType);

      setProgress(35);
      await uploadDatasetFileToStorage(upload_url, selectedFile, contentType);

      setProgress(80);
      const createdDataset = await createDataset(token, {
        name: form.name.trim(),
        subtitle: "",
        description: form.description.trim(),
        category: form.category,
        size: formatFileSize(selectedFile.size),
        format: inferDatasetFormats(selectedFile),
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        file_path,
        license: form.license,
      });

      clearInterval(interval);
      setProgress(100);

      onUploaded({
        id: String(createdDataset.id),
        name: createdDataset.name,
        description: createdDataset.description,
        category: createdDataset.category,
        license: createdDataset.license,
        tags: form.tags,
        fileName: selectedFile.name,
        fileSize: formatFileSize(selectedFile.size),
        uploadedAt: "Just now",
      });
    } catch (err) {
      clearInterval(interval);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "object" && err !== null && "message" in err && typeof err.message === "string") {
        setError(err.message);
      } else {
        setError("Failed to upload dataset");
      }
    } finally {
      setUploading(false);
    }
  };

  // Todo add ability to set dataset to private or public on upload 

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">

        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Upload Dataset</h2>
            <p className="text-sm text-gray-500 mt-0.5">{step === "details" ? "Step 1 of 2 — Dataset details" : "Step 2 of 2 — Upload file"}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Step pills */}
          <div className="flex items-center gap-2 mb-6">
            {["Details", "File"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  (i === 0 && step === "details") || (i === 1 && step === "file") ? "bg-green-600 text-white"
                  : i === 0 && step === "file" ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-400"}`}>
                  {i === 0 && step === "file" ? "✓" : i + 1}
                </div>
                <span className="text-sm text-gray-500">{s}</span>
                {i === 0 && <div className="w-8 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>

          {step === "details" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dataset Name <span className="text-red-500">*</span></label>
                <input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. Zimbabwe Census 2022" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <RichTextEditor
                  value={form.description}
                  onChange={(description) => setForm({ ...form, description })}
                  placeholder="What does this dataset contain? How was it collected?"
                  minHeightClassName="min-h-32"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {DATASET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">License</label>
                  <select className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })}>
                    {LICENSES.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags <span className="text-gray-400 font-normal">(comma separated)</span></label>
                <input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. demographics, zimbabwe, census"
                  value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              </div>
            </div>
          )}

          {step === "file" && (
            <div>
              <div onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                  selectedFile ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-green-400 hover:bg-green-50"}`}>
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }} />
                {selectedFile ? (
                  <div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Database className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{formatFileSize(selectedFile.size)}</p>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="mt-3 text-xs text-red-500 hover:text-red-700">Remove file</button>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-700">Drop your dataset file here</p>
                    <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                    <p className="text-xs text-gray-400 mt-3">.csv, .json, .parquet, .xlsx, .zip, .tar.gz</p>
                  </div>
                )}
              </div>
              {uploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1.5">
                    <span>Uploading...</span><span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-100">
          <button onClick={step === "details" ? onClose : () => setStep("details")}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">
            {step === "details" ? "Cancel" : "← Back"}
          </button>
          {step === "details" ? (
            <button onClick={() => setStep("file")} disabled={!form.name.trim()}
              className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Next: Upload File →
            </button>
          ) : (
            <button onClick={handleUpload} disabled={!selectedFile || uploading}
              className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {uploading ? "Uploading..." : "Upload Dataset"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
