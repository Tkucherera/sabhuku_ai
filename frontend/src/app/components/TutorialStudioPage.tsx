import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Eye,
  Image as ImageIcon,
  Loader2,
  Save,
  Send,
  Code2,
  Heading2,
  List,
  Quote,
} from "lucide-react";

import { PlatformLayout } from "./PlatformLayout";
import { useAuth } from "./AuthContext";
import {
  createTutorial,
  fetchTutorialBySlug,
  requestTutorialImageUploadUrl,
  updateTutorial,
  uploadTutorialImageToStorage,
} from "../api/tutorialApi";
import { TutorialPayload } from "../../types";

type SaveMode = "draft" | "published";
type EditorTab = "write" | "preview";

type TutorialFormState = TutorialPayload & {
  tag_input: string;
};

const initialForm: TutorialFormState = {
  title: "",
  slug: "",
  excerpt: "",
  body_markdown: "## Introduction\n\nWrite your tutorial here.\n",
  status: "draft",
  seo_title: "",
  meta_description: "",
  seo_keywords: "",
  cover_image_url: "",
  cover_image_path: "",
  cover_image_alt: "",
  thumbnail_image_url: "",
  thumbnail_image_path: "",
  tags: [],
  tag_input: "",
};

function buildSnippet(type: "heading" | "code" | "list" | "quote") {
  switch (type) {
    case "heading":
      return "\n## New Section\n\nAdd the key idea here.\n";
    case "code":
      return "\n```python\nprint('hello world')\n```\n";
    case "list":
      return "\n- First point\n- Second point\n- Third point\n";
    case "quote":
      return "\n> Add a key callout or note here.\n";
  }
}

function renderPreview(markdown: string) {
  return markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`)
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" />')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<h|<ul|<pre|<blockquote|<img)(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "");
}

export function TutorialStudioPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();
  const markdownRef = useRef<HTMLTextAreaElement>(null);

  const [form, setForm] = useState<TutorialFormState>(initialForm);
  const [loading, setLoading] = useState(Boolean(slug));
  const [saving, setSaving] = useState<SaveMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadingInlineImage, setUploadingInlineImage] = useState(false);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [uploadingThumbnailImage, setUploadingThumbnailImage] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>("write");

  useEffect(() => {
    let cancelled = false;

    const loadTutorial = async () => {
      if (!slug || !token) return;
      try {
        const tutorial = await fetchTutorialBySlug(slug, token);
        if (cancelled) return;
        setForm({
          title: tutorial.title,
          slug: tutorial.slug,
          excerpt: tutorial.excerpt,
          body_markdown: tutorial.body_markdown,
          status: tutorial.status,
          seo_title: tutorial.seo_title,
          meta_description: tutorial.meta_description,
          seo_keywords: tutorial.seo_keywords,
          cover_image_url: tutorial.cover_image_url || tutorial.cover_image || "",
          cover_image_path: tutorial.cover_image_path || "",
          cover_image_alt: tutorial.cover_image_alt || "",
          thumbnail_image_url: tutorial.thumbnail_image_url || tutorial.thumbnail_image || "",
          thumbnail_image_path: tutorial.thumbnail_image_path || "",
          tags: tutorial.tags.map((tag) => tag.name),
          tag_input: tutorial.tags.map((tag) => tag.name).join(", "),
        });
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Failed to load tutorial for editing.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadTutorial();

    return () => {
      cancelled = true;
    };
  }, [slug, token]);

  const previewHtml = useMemo(() => renderPreview(form.body_markdown), [form.body_markdown]);

  const updateField = <K extends keyof TutorialFormState>(field: K, value: TutorialFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const appendMarkdown = (snippet: string) => {
    const target = markdownRef.current;
    const insertion = snippet.startsWith("\n") ? snippet : `\n${snippet}`;
    updateField("body_markdown", `${form.body_markdown}${insertion}`);
    target?.focus();
  };

  const uploadImage = async (file: File, mode: "inline" | "cover" | "thumbnail") => {
    if (!token) return;
    const contentType = file.type || "application/octet-stream";
    const setUploading =
      mode === "inline"
        ? setUploadingInlineImage
        : mode === "cover"
        ? setUploadingCoverImage
        : setUploadingThumbnailImage;

    setUploading(true);
    setError(null);

    try {
      const { upload_url, file_path, file_url } = await requestTutorialImageUploadUrl(token, file.name, contentType);
      await uploadTutorialImageToStorage(upload_url, file, contentType);

      if (mode === "inline") {
        appendMarkdown(`\n![${file.name}](${file_url})\n`);
      } else if (mode === "cover") {
        setForm((prev) => ({
          ...prev,
          cover_image_path: file_path,
          cover_image_url: file_url,
          cover_image_alt: prev.cover_image_alt || prev.title || file.name,
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          thumbnail_image_path: file_path,
          thumbnail_image_url: file_url,
        }));
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>, mode: "inline" | "cover" | "thumbnail") => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadImage(file, mode);
    event.target.value = "";
  };

  const handleSave = async (mode: SaveMode) => {
    if (!token) return;

    const payload: TutorialPayload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim(),
      body_markdown: form.body_markdown,
      status: mode,
      seo_title: form.seo_title.trim(),
      meta_description: form.meta_description.trim(),
      seo_keywords: form.seo_keywords.trim(),
      cover_image_url: form.cover_image_url.trim(),
      cover_image_path: form.cover_image_path.trim(),
      cover_image_alt: form.cover_image_alt.trim(),
      thumbnail_image_url: form.thumbnail_image_url.trim(),
      thumbnail_image_path: form.thumbnail_image_path.trim(),
      tags: form.tag_input
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (!payload.title || !payload.body_markdown.trim()) {
      setError("Title and tutorial content are required.");
      return;
    }

    setSaving(mode);
    setError(null);
    setNotice(null);

    try {
      const saved = slug
        ? await updateTutorial(token, slug, payload)
        : await createTutorial(token, payload);
      setForm((prev) => ({
        ...prev,
        slug: saved.slug,
        status: saved.status,
        tag_input: saved.tags.map((tag) => tag.name).join(", "),
      }));
      setNotice(mode === "published" ? "Tutorial published successfully." : "Draft saved.");
      if (!slug) {
        navigate(`/tutorials/studio/${saved.slug}`, { replace: true });
      }
    } catch {
      setError("Failed to save tutorial.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <PlatformLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/learning" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-4 w-4" />
              Back to learning
            </Link>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
              {slug ? "Edit tutorial" : "Write a tutorial"}
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Create SEO-friendly community tutorials with markdown, images, code samples, metadata, and publish controls directly in the app.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSave("draft")}
              disabled={saving !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save draft
            </button>
            <button
              type="button"
              onClick={() => void handleSave("published")}
              disabled={saving !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving === "published" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
        {notice ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
            Loading editor...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_380px]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm font-semibold text-slate-800">Title</span>
                    <input
                      value={form.title}
                      onChange={(event) => updateField("title", event.target.value)}
                      placeholder="How to deploy low-latency African language models"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-blue-500"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">Slug</span>
                    <input
                      value={form.slug}
                      onChange={(event) => updateField("slug", event.target.value)}
                      placeholder="auto-generated-if-empty"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">Tags</span>
                    <input
                      value={form.tag_input}
                      onChange={(event) => updateField("tag_input", event.target.value)}
                      placeholder="llm, rag, africa, deployment"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm font-semibold text-slate-800">Excerpt</span>
                    <textarea
                      value={form.excerpt}
                      onChange={(event) => updateField("excerpt", event.target.value)}
                      rows={3}
                      placeholder="A short summary that can double as your meta description if needed."
                      className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  {[
                    { type: "heading", label: "Section", icon: Heading2 },
                    { type: "code", label: "Code", icon: Code2 },
                    { type: "list", label: "List", icon: List },
                    { type: "quote", label: "Quote", icon: Quote },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => appendMarkdown(buildSnippet(item.type as "heading" | "code" | "list" | "quote"))}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                    {uploadingInlineImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    Insert image
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleFileSelected(event, "inline")} />
                  </label>
                </div>

                <div>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => setEditorTab("write")}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                          editorTab === "write"
                            ? "bg-white text-slate-950 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorTab("preview")}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                          editorTab === "preview"
                            ? "bg-white text-slate-950 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </button>
                    </div>

                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                      {editorTab === "write" ? "Focused writing" : "Live preview"}
                    </span>
                  </div>

                  {editorTab === "write" ? (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">Markdown</h2>
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                          Writing
                        </span>
                      </div>
                      <textarea
                        ref={markdownRef}
                        value={form.body_markdown}
                        onChange={(event) => updateField("body_markdown", event.target.value)}
                        rows={28}
                        className="min-h-[760px] w-full rounded-3xl border border-slate-300 bg-slate-950 px-5 py-5 font-mono text-sm leading-7 text-slate-50 outline-none transition focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">Preview</h2>
                        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                          <Eye className="h-4 w-4" />
                          Live preview
                        </span>
                      </div>
                      <div
                        className="prose min-h-[760px] max-w-none rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">SEO and publishing</h2>
                <div className="mt-4 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">SEO title</span>
                    <input
                      value={form.seo_title}
                      onChange={(event) => updateField("seo_title", event.target.value)}
                      placeholder="Override search result title"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">Meta description</span>
                    <textarea
                      value={form.meta_description}
                      onChange={(event) => updateField("meta_description", event.target.value)}
                      rows={4}
                      placeholder="Short search snippet for the article"
                      className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">SEO keywords</span>
                    <input
                      value={form.seo_keywords}
                      onChange={(event) => updateField("seo_keywords", event.target.value)}
                      placeholder="comma-separated keywords"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Media</h2>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">Cover image</span>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                        {uploadingCoverImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleFileSelected(event, "cover")} />
                      </label>
                    </div>
                    <input
                      value={form.cover_image_url}
                      onChange={(event) => updateField("cover_image_url", event.target.value)}
                      placeholder="https://..."
                      className="mb-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                    <input
                      value={form.cover_image_alt}
                      onChange={(event) => updateField("cover_image_alt", event.target.value)}
                      placeholder="Cover image alt text"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">Thumbnail</span>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                        {uploadingThumbnailImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleFileSelected(event, "thumbnail")} />
                      </label>
                    </div>
                    <input
                      value={form.thumbnail_image_url}
                      onChange={(event) => updateField("thumbnail_image_url", event.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">SEO checklist</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  <li>Use a keyword-focused title and slug.</li>
                  <li>Add H2 sections so the left table of contents stays useful.</li>
                  <li>Include code, screenshots, and internal links to Sabhuku models or datasets.</li>
                  <li>Keep the excerpt and meta description clear and non-duplicative.</li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
