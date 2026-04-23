import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Bold,
  Italic,
  Link as LinkIcon,
  AlignLeft,
  Code,
  Minus,
  ListOrdered,
  Pilcrow,
} from "lucide-react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";

import { PlatformLayout } from "./PlatformLayout";
import { useAuth } from "./AuthContext";
import {
  createTutorial,
  fetchTutorialBySlug,
  uploadTutorialImage, // NEW — replaces requestTutorialImageUploadUrl + uploadTutorialImageToStorage
  updateTutorial,
} from "../api/tutorialApi";
import { TutorialPayload } from "../../types";



type SaveMode = "draft" | "published";
type EditorMode = "rich" | "markdown";
type PreviewTab = "write" | "preview";

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

// ---------------------------------------------------------------------------
// Tiptap HTML → rough Markdown (for storing body_markdown from rich editor)
// ---------------------------------------------------------------------------

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "_$1_")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "_$1_")
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "```\n$1\n```\n\n")
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) =>
      inner.trim().split("\n").map((l: string) => `> ${l}`).join("\n") + "\n\n"
    )
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<\/?ul[^>]*>/gi, "\n")
    .replace(/<\/?ol[^>]*>/gi, "\n")
    .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, "![$1]($2)\n")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<hr[^>]*\/?>/gi, "\n---\n\n")
    .replace(/<br[^>]*\/?>/gi, "\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}



function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active
          ? "bg-blue-100 text-blue-700"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function RichToolbar({
  editor,
  onInsertImage,
  uploadingInline,
}: {
  editor: Editor;
  onInsertImage: (e: ChangeEvent<HTMLInputElement>) => void;
  uploadingInline: boolean;
}) {
  const setLink = useCallback(() => {
    const url = window.prompt("Enter URL");
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
      {/* Text style */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
        <Code className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-slate-200" />

      {/* Headings */}
      <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} title="Paragraph">
        <Pilcrow className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <span className="text-xs font-bold">H3</span>
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-slate-200" />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
        <Code2 className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-slate-200" />

      {/* Link & image */}
      <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Insert link">
        <LinkIcon className="h-3.5 w-3.5" />
      </ToolbarButton>

      <label
        className="inline-flex h-8 cursor-pointer items-center justify-center rounded-lg px-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        title="Insert image"
      >
        {uploadingInline ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
        <input type="file" accept="image/*" className="hidden" onChange={onInsertImage} />
      </label>

      <div className="mx-1 h-5 w-px bg-slate-200" />

      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule" active={false}>
        <Minus className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
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

  // Rich vs Markdown mode toggle
  const [editorMode, setEditorMode] = useState<EditorMode>("rich");
  // Markdown tab (write/preview) — only shown in markdown mode
  const [markdownTab, setMarkdownTab] = useState<PreviewTab>("write");



  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing your tutorial…" }),
      TiptapImage.configure({ inline: false, allowBase64: false }),
      TiptapLink.configure({ openOnClick: false }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      // Keep body_markdown in sync from rich editor
      const html = editor.getHTML();
      setForm((prev) => ({ ...prev, body_markdown: htmlToMarkdown(html) }));
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[680px] focus:outline-none prose prose-slate max-w-none px-6 py-5 text-slate-900 leading-7",
      },
    },
  });



  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!slug || !token) return;
      try {
        const tutorial = await fetchTutorialBySlug(slug, token);
        if (cancelled) return;
        const formState: TutorialFormState = {
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
          tags: tutorial.tags.map((t) => t.name),
          tag_input: tutorial.tags.map((t) => t.name).join(", "),
        };
        setForm(formState);
        // Populate rich editor with existing markdown (rendered as simple HTML)
        if (editor && tutorial.body_markdown) {
          editor.commands.setContent(renderPreview(tutorial.body_markdown));
        }
        setError(null);
      } catch {
        if (!cancelled) setError("Failed to load tutorial for editing.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [slug, token, editor]);

  const previewHtml = useMemo(() => renderPreview(form.body_markdown), [form.body_markdown]);

  const updateField = <K extends keyof TutorialFormState>(field: K, value: TutorialFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

 

  const uploadImage = async (file: File, mode: "inline" | "cover" | "thumbnail") => {
    if (!token) return;
    const setUploading =
      mode === "inline" ? setUploadingInlineImage
      : mode === "cover" ? setUploadingCoverImage
      : setUploadingThumbnailImage;

    setUploading(true);
    setError(null);

    try {
      const { file_path, file_url } = await uploadTutorialImage(token, file);

      if (mode === "inline") {
        if (editorMode === "rich" && editor) {
          editor.chain().focus().setImage({ src: file_url, alt: file.name }).run();
        } else {
          const snippet = `\n![${file.name}](${file_url})\n`;
          updateField("body_markdown", form.body_markdown + snippet);
        }
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>, mode: "inline" | "cover" | "thumbnail") => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file, mode);
    e.target.value = "";
  };

  // ---------------------------------------------------------------------------
  // Switch between rich and markdown modes
  // ---------------------------------------------------------------------------

  const switchToMarkdown = () => {
    if (editor) {
      // Sync rich editor → markdown textarea
      setForm((prev) => ({ ...prev, body_markdown: htmlToMarkdown(editor.getHTML()) }));
    }
    setEditorMode("markdown");
  };

  const switchToRich = () => {
    if (editor) {
      // Sync markdown → rich editor
      editor.commands.setContent(renderPreview(form.body_markdown));
    }
    setEditorMode("rich");
  };

  // ---------------------------------------------------------------------------
  // Markdown editor: insert snippet at cursor
  // ---------------------------------------------------------------------------

  const appendMarkdown = (snippet: string) => {
    const target = markdownRef.current;
    const insertion = snippet.startsWith("\n") ? snippet : `\n${snippet}`;
    const next = form.body_markdown + insertion;
    updateField("body_markdown", next);
    // Also sync to rich editor if we switch back
    target?.focus();
  };

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const handleSave = async (mode: SaveMode) => {
    if (!token) return;

    // If in rich mode, sync once more before saving
    if (editorMode === "rich" && editor) {
      const md = htmlToMarkdown(editor.getHTML());
      setForm((prev) => ({ ...prev, body_markdown: md }));
    }

    const payload: TutorialPayload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim(),
      body_markdown: editorMode === "rich" && editor ? htmlToMarkdown(editor.getHTML()) : form.body_markdown,
      status: mode,
      seo_title: form.seo_title.trim(),
      meta_description: form.meta_description.trim(),
      seo_keywords: form.seo_keywords.trim(),
      cover_image_url: form.cover_image_url.trim(),
      cover_image_path: form.cover_image_path.trim(),
      cover_image_alt: form.cover_image_alt.trim(),
      thumbnail_image_url: form.thumbnail_image_url.trim(),
      thumbnail_image_path: form.thumbnail_image_path.trim(),
      tags: form.tag_input.split(",").map((t) => t.trim()).filter(Boolean),
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
        tag_input: saved.tags.map((t) => t.name).join(", "),
      }));
      setNotice(mode === "published" ? "Tutorial published successfully." : "Draft saved.");
      if (!slug) navigate(`/tutorials/studio/${saved.slug}`, { replace: true });
    } catch {
      setError("Failed to save tutorial.");
    } finally {
      setSaving(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <PlatformLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
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
              Create SEO-friendly community tutorials with rich text or markdown, images, code samples, metadata, and publish controls.
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

        {/* Alerts */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {notice && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
            Loading editor...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_380px]">

            {/* ---- Main column ---- */}
            <section className="space-y-6">

              {/* Basic fields */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm font-semibold text-slate-800">Title</span>
                    <input
                      value={form.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="How to deploy low-latency African language models"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">Slug</span>
                    <input
                      value={form.slug}
                      onChange={(e) => updateField("slug", e.target.value)}
                      placeholder="auto-generated-if-empty"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">Tags</span>
                    <input
                      value={form.tag_input}
                      onChange={(e) => updateField("tag_input", e.target.value)}
                      placeholder="llm, rag, africa, deployment"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm font-semibold text-slate-800">Excerpt</span>
                    <textarea
                      value={form.excerpt}
                      onChange={(e) => updateField("excerpt", e.target.value)}
                      rows={3}
                      placeholder="A short summary shown on cards and used as meta description."
                      className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>
                </div>
              </div>

              {/* Editor */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                {/* Mode switcher */}
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={switchToRich}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        editorMode === "rich" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Rich text
                    </button>
                    <button
                      type="button"
                      onClick={switchToMarkdown}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        editorMode === "markdown" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Markdown
                    </button>
                  </div>
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    {editorMode === "rich" ? "WYSIWYG editor" : "Raw markdown"}
                  </span>
                </div>

                {/* ---- RICH TEXT MODE ---- */}
                {editorMode === "rich" && editor && (
                  <div>
                    <RichToolbar
                      editor={editor}
                      onInsertImage={(e) => void handleFileSelected(e, "inline")}
                      uploadingInline={uploadingInlineImage}
                    />
                    <div className="mt-3 min-h-[680px] rounded-3xl border border-slate-200 bg-white">
                      <EditorContent editor={editor} />
                    </div>
                  </div>
                )}

                {/* ---- MARKDOWN MODE ---- */}
                {editorMode === "markdown" && (
                  <div>
                    {/* Quick-insert toolbar */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      {[
                        { type: "heading", label: "Section", icon: Heading2 },
                        { type: "code", label: "Code", icon: Code2 },
                        { type: "list", label: "List", icon: List },
                        { type: "quote", label: "Quote", icon: Quote },
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => {
                            const snippets: Record<string, string> = {
                              heading: "\n## New Section\n\nAdd the key idea here.\n",
                              code: "\n```python\nprint('hello world')\n```\n",
                              list: "\n- First point\n- Second point\n- Third point\n",
                              quote: "\n> Add a key callout or note here.\n",
                            };
                            appendMarkdown(snippets[item.type]);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </button>
                      ))}
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                        {uploadingInlineImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        Insert image
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => void handleFileSelected(e, "inline")} />
                      </label>
                    </div>

                    {/* Write / Preview tabs */}
                    <div className="mb-3 flex items-center gap-3">
                      <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                        <button
                          type="button"
                          onClick={() => setMarkdownTab("write")}
                          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            markdownTab === "write" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Write
                        </button>
                        <button
                          type="button"
                          onClick={() => setMarkdownTab("preview")}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            markdownTab === "preview" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </button>
                      </div>
                    </div>

                    {markdownTab === "write" ? (
                      <textarea
                        ref={markdownRef}
                        value={form.body_markdown}
                        onChange={(e) => updateField("body_markdown", e.target.value)}
                        rows={28}
                        className="min-h-[680px] w-full rounded-3xl border border-slate-300 bg-slate-950 px-5 py-5 font-mono text-sm leading-7 text-slate-50 outline-none transition focus:border-blue-500"
                      />
                    ) : (
                      <div
                        className="prose min-h-[680px] max-w-none rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* ---- Sidebar ---- */}
            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">SEO and publishing</h2>
                <div className="mt-4 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">SEO title</span>
                    <input
                      value={form.seo_title}
                      onChange={(e) => updateField("seo_title", e.target.value)}
                      placeholder="Override search result title"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">Meta description</span>
                    <textarea
                      value={form.meta_description}
                      onChange={(e) => updateField("meta_description", e.target.value)}
                      rows={4}
                      placeholder="Short search snippet for the article"
                      className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">SEO keywords</span>
                    <input
                      value={form.seo_keywords}
                      onChange={(e) => updateField("seo_keywords", e.target.value)}
                      placeholder="comma-separated keywords"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Media</h2>
                <div className="mt-4 space-y-4">

                  {/* Cover image */}
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">Cover image</span>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                        {uploadingCoverImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => void handleFileSelected(e, "cover")} />
                      </label>
                    </div>
                    {form.cover_image_url && (
                      <img
                        src={form.cover_image_url}
                        alt={form.cover_image_alt || "Cover"}
                        className="mb-3 h-32 w-full rounded-xl object-cover"
                      />
                    )}
                    <input
                      value={form.cover_image_url}
                      onChange={(e) => updateField("cover_image_url", e.target.value)}
                      placeholder="https://… or paste URL"
                      className="mb-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                    <input
                      value={form.cover_image_alt}
                      onChange={(e) => updateField("cover_image_alt", e.target.value)}
                      placeholder="Cover image alt text"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  {/* Thumbnail */}
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">Thumbnail</span>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                        {uploadingThumbnailImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => void handleFileSelected(e, "thumbnail")} />
                      </label>
                    </div>
                    {form.thumbnail_image_url && (
                      <img
                        src={form.thumbnail_image_url}
                        alt="Thumbnail preview"
                        className="mb-3 h-24 w-full rounded-xl object-cover"
                      />
                    )}
                    <input
                      value={form.thumbnail_image_url}
                      onChange={(e) => updateField("thumbnail_image_url", e.target.value)}
                      placeholder="https://… or paste URL"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">SEO checklist</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  <li>Use a keyword-focused title and slug.</li>
                  <li>Add H2 sections so the table of contents stays useful.</li>
                  <li>Include code, screenshots, and internal links to Sabhuku models or datasets.</li>
                  <li>Keep the excerpt and meta description clear and non-duplicative.</li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Tiptap prose styles injected globally */}
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #94a3b8;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror h2 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
        .ProseMirror h3 { font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
        .ProseMirror p { margin: 0.75rem 0; }
        .ProseMirror ul { list-style: disc; padding-left: 1.5rem; margin: 0.75rem 0; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; margin: 0.75rem 0; }
        .ProseMirror li { margin: 0.25rem 0; }
        .ProseMirror blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; color: #475569; margin: 1rem 0; font-style: italic; }
        .ProseMirror pre { background: #0f172a; color: #f1f5f9; padding: 1rem; border-radius: 0.75rem; margin: 1rem 0; overflow-x: auto; }
        .ProseMirror code { background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-size: 0.875em; }
        .ProseMirror pre code { background: transparent; padding: 0; }
        .ProseMirror img { max-width: 100%; border-radius: 0.75rem; margin: 1rem 0; }
        .ProseMirror hr { border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0; }
        .ProseMirror a { color: #2563eb; text-decoration: underline; }
      `}</style>
    </PlatformLayout>
  );
}