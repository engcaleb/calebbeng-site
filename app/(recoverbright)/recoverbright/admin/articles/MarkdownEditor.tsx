"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { marked } from "marked";

type ToolbarAction = {
  label: string;
  style?: string;
  action: (
    text: string,
    selStart: number,
    selEnd: number,
  ) => { text: string; selStart: number; selEnd: number };
};

function wrapSelection(
  text: string,
  selStart: number,
  selEnd: number,
  before: string,
  after: string,
  placeholder: string,
): { text: string; selStart: number; selEnd: number } {
  const selected = text.slice(selStart, selEnd);
  if (
    selected &&
    text.slice(selStart - before.length, selStart) === before &&
    text.slice(selEnd, selEnd + after.length) === after
  ) {
    return {
      text:
        text.slice(0, selStart - before.length) +
        selected +
        text.slice(selEnd + after.length),
      selStart: selStart - before.length,
      selEnd: selEnd - before.length,
    };
  }
  const insert = selected || placeholder;
  return {
    text: text.slice(0, selStart) + before + insert + after + text.slice(selEnd),
    selStart: selStart + before.length,
    selEnd: selStart + before.length + insert.length,
  };
}

function prefixLines(
  text: string,
  selStart: number,
  selEnd: number,
  prefixFn: (lineIndex: number) => string,
  placeholder: string,
): { text: string; selStart: number; selEnd: number } {
  const before = text.slice(0, selStart);
  const selected = text.slice(selStart, selEnd) || placeholder;
  const after = text.slice(selEnd);
  const lines = selected.split("\n");
  const prefixed = lines.map((line, i) => prefixFn(i) + line).join("\n");
  return {
    text: before + prefixed + after,
    selStart: selStart,
    selEnd: selStart + prefixed.length,
  };
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    label: "B",
    style: "font-bold",
    action: (t, s, e) => wrapSelection(t, s, e, "**", "**", "bold text"),
  },
  {
    label: "I",
    style: "italic",
    action: (t, s, e) => wrapSelection(t, s, e, "*", "*", "italic text"),
  },
  {
    label: "H2",
    action: (t, s, e) => prefixLines(t, s, e, () => "## ", "Heading"),
  },
  {
    label: "H3",
    action: (t, s, e) => prefixLines(t, s, e, () => "### ", "Heading"),
  },
  {
    label: "Link",
    action: (t, s, e) => {
      const selected = t.slice(s, e) || "link text";
      const insert = `[${selected}](url)`;
      return {
        text: t.slice(0, s) + insert + t.slice(e),
        selStart: s + selected.length + 3,
        selEnd: s + selected.length + 6,
      };
    },
  },
  {
    label: "UL",
    action: (t, s, e) => prefixLines(t, s, e, () => "- ", "list item"),
  },
  {
    label: "OL",
    action: (t, s, e) =>
      prefixLines(t, s, e, (i) => `${i + 1}. `, "list item"),
  },
  {
    label: '"',
    action: (t, s, e) => prefixLines(t, s, e, () => "> ", "quote"),
  },
  {
    label: "—",
    action: (t, s, _e) => {
      const insert = "\n---\n";
      return {
        text: t.slice(0, s) + insert + t.slice(s),
        selStart: s + insert.length,
        selEnd: s + insert.length,
      };
    },
  },
];

export function MarkdownEditor({
  defaultValue,
}: {
  defaultValue?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(defaultValue ?? "");
  const [previewHtml, setPreviewHtml] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    setPreviewHtml(marked.parse(content) as string);
  }, []);

  const updatePreview = useCallback((md: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewHtml(marked.parse(md) as string);
    }, 300);
  }, []);

  function handleToolbarClick(action: ToolbarAction["action"]) {
    const ta = textareaRef.current;
    if (!ta) return;
    const { text, selStart, selEnd } = action(
      content,
      ta.selectionStart,
      ta.selectionEnd,
    );
    setContent(text);
    updatePreview(text);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    updatePreview(val);
  }

  return (
    <div>
      <input type="hidden" name="content" value={content} />
      <div className="mb-2 flex items-center gap-1">
        {TOOLBAR_ACTIONS.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={() => handleToolbarClick(btn.action)}
            className={`rounded px-2 py-1 font-mono text-[11px] text-[#1c1a17]/50 transition hover:bg-[#1c1a17]/8 hover:text-[#1c1a17] ${btn.style ?? ""}`}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="label mb-1">Content (Markdown)</p>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            rows={20}
            className="input min-h-[500px] font-mono text-[13px] leading-relaxed"
            placeholder="Write your article in Markdown..."
          />
        </div>
        <div>
          <p className="label mb-1">Preview</p>
          <div
            className="article-content min-h-[500px] overflow-y-auto rounded border border-[#1c1a17]/8 bg-white p-4"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>
    </div>
  );
}
