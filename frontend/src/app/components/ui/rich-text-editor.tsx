import * as React from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  RemoveFormatting,
} from "lucide-react";

import { Button } from "./button";
import { cn } from "./utils";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  minHeightClassName?: string;
};

type CommandName =
  | "bold"
  | "italic"
  | "underline"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "removeFormat";

const toolbarButtons: Array<{
  label: string;
  command: CommandName;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { label: "Bold", command: "bold", icon: Bold },
  { label: "Italic", command: "italic", icon: Italic },
  { label: "Underline", command: "underline", icon: UnderlineIcon },
  { label: "Bulleted list", command: "insertUnorderedList", icon: List },
  { label: "Numbered list", command: "insertOrderedList", icon: ListOrdered },
];

function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
  className,
  editorClassName,
  minHeightClassName = "min-h-40",
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const [selectionVersion, setSelectionVersion] = React.useState(0);

  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor || isFocused) return;
    if (editor.innerHTML !== value) {
      editor.innerHTML = value || "";
    }
  }, [value, isFocused]);

  const emitChange = React.useCallback(() => {
    onChange(editorRef.current?.innerHTML ?? "");
  }, [onChange]);

  const focusEditor = React.useCallback(() => {
    editorRef.current?.focus();
  }, []);

  const runCommand = React.useCallback(
    (command: CommandName, commandValue?: string) => {
      focusEditor();
      document.execCommand(command, false, commandValue);
      emitChange();
      setSelectionVersion((current) => current + 1);
    },
    [emitChange, focusEditor],
  );

  const insertLink = React.useCallback(() => {
    focusEditor();
    const url = window.prompt("Enter a URL", "https://");
    if (!url) return;

    const normalizedUrl =
      url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")
        ? url
        : `https://${url}`;

    document.execCommand("createLink", false, normalizedUrl);
    emitChange();
    setSelectionVersion((current) => current + 1);
  }, [emitChange, focusEditor]);

  const isCommandActive = React.useCallback((command: Exclude<CommandName, "removeFormat">) => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  }, []);

  return (
    <div className={cn("rounded-2xl border border-gray-300 bg-white shadow-sm", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-slate-50 px-3 py-2">
        {toolbarButtons.map(({ label, command, icon: Icon }) => (
          <Button
            key={command}
            type="button"
            variant={isCommandActive(command) ? "secondary" : "ghost"}
            size="sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(command)}
            aria-label={label}
            title={label}
            className="h-8 rounded-lg px-2.5 text-slate-700"
          >
            <Icon className="size-4" />
          </Button>
        ))}

        <div className="mx-1 h-6 w-px bg-gray-200" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(event) => event.preventDefault()}
          onClick={insertLink}
          aria-label="Insert link"
          title="Insert link"
          className="h-8 rounded-lg px-2.5 text-slate-700"
        >
          <LinkIcon className="size-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("removeFormat")}
          aria-label="Clear formatting"
          title="Clear formatting"
          className="h-8 rounded-lg px-2.5 text-slate-700"
        >
          <RemoveFormatting className="size-4" />
        </Button>
      </div>

      <div className="relative">
        {!value && !isFocused ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 px-4 py-3 text-sm text-gray-400">
            {placeholder}
          </div>
        ) : null}

        <div
          key={selectionVersion > -1 ? "editor" : "editor"}
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className={cn(
            minHeightClassName,
            "prose prose-sm max-w-none rounded-b-2xl px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20",
            "[&>ol]:list-decimal [&>ol]:pl-6 [&>p]:my-2 [&>ul]:list-disc [&>ul]:pl-6 [&_a]:text-blue-600 [&_a]:underline",
            editorClassName,
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            emitChange();
          }}
          onInput={emitChange}
          onKeyUp={() => setSelectionVersion((current) => current + 1)}
          onMouseUp={() => setSelectionVersion((current) => current + 1)}
        />
      </div>
    </div>
  );
}

export { RichTextEditor };
