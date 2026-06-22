# Markdown Editor Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain textarea in the article admin with a formatting toolbar + side-by-side live preview, using no new dependencies.

**Architecture:** One new client component `MarkdownEditor.tsx` owns the toolbar, controlled textarea, and preview pane. `ArticleForm.tsx` swaps its textarea for this component and syncs the value via a hidden input. Preview renders with `marked.parse()` (already installed, v18) client-side, using the same `.article-content` CSS classes as the public article page.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, `marked` v18

## Global Constraints

- `"use client"` directive required at top of new component (client-side state + DOM APIs)
- No new npm dependencies — only `marked` (already in package.json)
- Admin UI styling: `font-mono text-[11px]`, `#1c1a17` color palette, `#f9f7f4` background, existing `.label`, `.input`, `.btn-ghost` utilities from `globals.css`
- Brand name is "RecoverBright" (one word, camelCase)
- Read Next.js 16 docs at `node_modules/next/dist/docs/` before writing code (per AGENTS.md)

---

### Task 1: Create MarkdownEditor component with toolbar and preview

**Files:**
- Create: `app/(recoverbright)/recoverbright/admin/articles/MarkdownEditor.tsx`
- Modify: `app/(recoverbright)/recoverbright/admin/articles/ArticleForm.tsx`

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: `<MarkdownEditor defaultValue?: string />` component that renders a hidden `<input name="content">` for form submission

- [ ] **Step 1: Create `MarkdownEditor.tsx` with toolbar, textarea, and preview pane**

Create the file at `app/(recoverbright)/recoverbright/admin/articles/MarkdownEditor.tsx`:

```tsx
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
```

- [ ] **Step 2: Update `ArticleForm.tsx` to use `MarkdownEditor`**

In `app/(recoverbright)/recoverbright/admin/articles/ArticleForm.tsx`, make two changes:

1. Add the import at the top (after existing imports):

```tsx
import { MarkdownEditor } from "./MarkdownEditor";
```

2. Replace the content textarea block (lines 169-178):

```tsx
      <div>
        <label className="label">Content (Markdown)</label>
        <textarea
          name="content"
          defaultValue={article?.content}
          rows={20}
          className="input mt-1 font-mono text-[13px] leading-relaxed"
          placeholder="Write your article in Markdown..."
        />
      </div>
```

with:

```tsx
      <MarkdownEditor defaultValue={article?.content ?? ""} />
```

The `MarkdownEditor` renders its own "Content (Markdown)" and "Preview" labels internally, plus a hidden `<input name="content">` that the form action reads.

- [ ] **Step 3: Run the dev server and verify**

```bash
cd ~/Desktop/calebbeng-site && npm run dev
```

Open `http://localhost:3000/recoverbright/admin/articles` (or the recoverbright hostname equivalent). Verify:

1. The toolbar renders above the editor area with all 9 buttons (B, I, H2, H3, Link, UL, OL, ", —)
2. Side-by-side layout: textarea on left, preview on right (on desktop)
3. Typing markdown in the textarea renders in the preview pane after ~300ms
4. Each toolbar button inserts correct markdown syntax:
   - Select text, click B → wraps in `**...**`
   - Click B with no selection → inserts `**bold text**` with "bold text" selected
   - Click B when already bold → removes the `**` wrapper (toggle off)
   - Same wrap/unwrap for I (italic)
   - H2/H3 prefix the line with `##`/`###`
   - Link inserts `[text](url)` with "url" selected for easy replacement
   - UL/OL/Quote prefix each selected line
   - — inserts `\n---\n` horizontal rule
5. Preview uses `.article-content` styles matching the public article page
6. On narrow viewport, layout stacks vertically
7. Editing an existing article loads its content into both textarea and preview
8. Saving the form (create or update) persists the content correctly

- [ ] **Step 4: Commit**

```bash
git add app/\(recoverbright\)/recoverbright/admin/articles/MarkdownEditor.tsx app/\(recoverbright\)/recoverbright/admin/articles/ArticleForm.tsx
git commit -m "feat(articles): add markdown toolbar + side-by-side preview to admin editor"
```
