# Markdown Editor Upgrade — Design Spec

## Summary

Replace the plain `<textarea>` in the article admin editor with a toolbar + side-by-side live preview. No new dependencies — toolbar inserts markdown syntax around selections, preview uses `marked` (already installed) client-side.

## New Component

**`MarkdownEditor.tsx`** — client component, extracted from the content textarea in `ArticleForm.tsx`.

Responsibilities:
- Controlled `<textarea>` (left pane)
- Formatting toolbar above the textarea
- Live-rendered preview pane (right side)
- Hidden `<input name="content">` that syncs the markdown value for form submission

`ArticleForm.tsx` swaps its textarea for `<MarkdownEditor defaultValue={article?.content} />`.

## Toolbar

Buttons above the textarea, left-aligned, monospace styling consistent with admin UI (`font-mono text-[11px]`, ghost-style buttons).

| Button | Label | Markdown inserted |
|--------|-------|-------------------|
| Bold | **B** | `**selection**` |
| Italic | *I* | `*selection*` |
| Heading 2 | H2 | `## selection` (line prefix) |
| Heading 3 | H3 | `### selection` (line prefix) |
| Link | Link | `[selection](url)` |
| Unordered list | UL | `- selection` (per line) |
| Ordered list | OL | `1. selection` (per line) |
| Blockquote | Quote | `> selection` (per line) |
| Horizontal rule | HR | `\n---\n` (inserted at cursor) |

Behavior:
- Each button operates on the current text selection in the textarea
- If nothing is selected, inserts placeholder text (e.g. "bold text", "link text")
- Focus returns to the textarea after insertion, with cursor positioned after the inserted syntax
- Wrap-style buttons (Bold, Italic, Link) toggle off if the selection is already wrapped

## Layout

Side-by-side inside the existing form card:

```
+-- Toolbar ------------------------------------------------+
| [B] [I] [H2] [H3] [Link] [UL] [OL] ["] [--]             |
+-------------------------+---------------------------------+
|   Textarea (edit)       |   Preview (rendered HTML)       |
|   monospace, 13px       |   .article-content styles       |
|   min-h-[500px]         |   min-h-[500px]                 |
|                         |   overflow-y-auto               |
+-------------------------+---------------------------------+
```

- `grid grid-cols-2 gap-4` on `md+` screens
- Stacks vertically (`grid-cols-1`) on narrow screens — textarea on top, preview below
- Preview pane has a subtle left border (`border-l border-[#1c1a17]/8`) and padding
- Textarea keeps existing styles: `font-mono text-[13px] leading-relaxed`

## Preview Rendering

- `marked.parse()` called client-side on content change, debounced ~300ms
- Output rendered via `dangerouslySetInnerHTML` in a div with `article-content` class
- Matches public article page styling exactly (same CSS classes from `globals.css`)
- Shows "Preview" label above the pane in muted monospace, matching the "Content (Markdown)" label style

## Files Changed

1. **`app/(recoverbright)/recoverbright/admin/articles/MarkdownEditor.tsx`** — new client component
2. **`app/(recoverbright)/recoverbright/admin/articles/ArticleForm.tsx`** — swap textarea for `<MarkdownEditor>`, add hidden input for content

## Dependencies

None added. Uses `marked` (already in package.json) client-side.

## Scope Boundaries

- Admin-only feature — no changes to public article rendering
- No changes to the article data model or server actions
- No syntax highlighting in the textarea (plain textarea, not CodeMirror)
- No image insertion toolbar button (images are handled by the separate cover image field)
