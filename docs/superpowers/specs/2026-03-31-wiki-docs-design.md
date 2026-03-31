# Wiki / Documentation Module Design — Nokan Taskboard

**Date**: 2026-03-31
**Status**: Approved
**Scope**: Notion-like documentation system with block editor, page tree, and nested pages

## Overview

Global documentation/wiki module for OWNER users. Notion-style block editor (BlockNote) with page hierarchy, drag-and-drop blocks, slash commands, and auto-save. Accessible from main navigation as "Dokumenty".

## Key Decisions

- **Access**: OWNER only
- **Scope**: Global (not per-board)
- **Editor**: BlockNote (React, TipTap/ProseMirror-based)
- **Storage**: JSONB content in Supabase
- **Navigation**: Link in sidebar, page tree inside docs layout
- **Auto-save**: Debounced 1s

## Database Schema

### wiki_pages

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| title | text | NOT NULL, default 'Nowa strona' |
| content | jsonb | BlockNote JSON content |
| icon | text | Emoji icon for page (nullable) |
| parent_id | uuid | FK → wiki_pages(id) ON DELETE CASCADE, nullable |
| sort_order | integer | DEFAULT 0 |
| created_by | uuid | FK → users(id) ON DELETE SET NULL |
| updated_by | uuid | FK → users(id) ON DELETE SET NULL |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

Index on parent_id for tree queries.

## Frontend Architecture

### Routing

```
/docs           → DocsLayout with empty state or redirect to last page
/docs/[id]      → DocsLayout with PageEditor for specific page
```

### Component Structure

```
src/app/docs/
├── page.tsx                        # Empty state / redirect
├── [id]/page.tsx                   # Page editor view

src/app/components/Docs/
├── DocsLayout.tsx                  # Sidebar + content layout, OWNER check
├── PageTree.tsx                    # Recursive page tree with DnD
├── PageTreeItem.tsx                # Single tree item (expand/collapse, icon, context menu)
├── PageEditor.tsx                  # BlockNote editor wrapper with auto-save
└── EmojiPicker.tsx                 # Simple emoji picker for page icons
```

### DocsLayout

- Left sidebar (w-64): PageTree + "Nowa strona" button + search input
- Main content area: children (PageEditor)
- OWNER role check — redirect non-OWNER to /dashboard
- Responsive: sidebar collapsible on mobile

### PageTree

- Fetches all pages via `getWikiPages` (flat list, builds tree client-side from parent_id)
- Recursive rendering with indentation per level
- Each item shows: icon (emoji or default), title, expand/collapse arrow if has children
- Active page highlighted
- Drag-and-drop for reordering and re-parenting (use @dnd-kit/core with sortable)
- Context menu (right-click or three-dot button): Add subpage, Rename, Delete
- Click → navigate to /docs/[id]

### PageEditor

- Uses BlockNote React component (`@blocknote/react`, `@blocknote/core`)
- Dark theme configuration matching app aesthetic
- Block types: paragraph, headings (H1-H3), bulleted list, numbered list, check list, table, image, code block, callout, separator, quote
- Image upload: custom upload handler using existing `/api/upload` pattern or new `/api/docs/upload` route
- Auto-save: `onChange` → debounce 1s → `updateWikiPage` mutation
- Page title: editable inline input above editor
- Page icon: clickable emoji, opens EmojiPicker

### Slash Commands (BlockNote built-in + custom)

BlockNote provides these out of the box:
- /heading, /bullet_list, /numbered_list, /check_list
- /table, /image, /code_block
- /quote, /separator

Custom additions:
- /callout (info/warning/success boxes)

## RTK Query Endpoints

New file: `src/app/store/endpoints/wikiEndpoints.ts`

- `getWikiPages` — query(void), returns WikiPage[] (all pages, flat), providesTags WikiPage
- `getWikiPageById` — query(pageId: string), returns WikiPage with content
- `createWikiPage` — mutation({ title, parent_id?, icon?, created_by }), returns new page
- `updateWikiPage` — mutation({ id, data: { title?, content?, icon?, updated_by } }), debounced from editor
- `deleteWikiPage` — mutation(id), CASCADE deletes children
- `reorderWikiPages` — mutation({ pages: { id, parent_id, sort_order }[] }), bulk update for DnD

Tag types: `WikiPage`

## API Routes

### POST /api/docs/upload

Image upload for BlockNote editor. Same pattern as existing upload routes:
- Validate session
- Accept file via FormData
- Upload to Supabase Storage (bucket: 'wiki-images')
- Return public URL

## Navigation

New link in Navbar sidebar (OWNER only):
- Icon: `BookOpen` from lucide-react
- Label: "Dokumenty" (i18n: `nav.docs`)
- Position: after Settings link

## i18n

Add `docs` section to both locales:

```json
"docs": {
  "title": "Dokumenty",
  "newPage": "Nowa strona",
  "untitled": "Nowa strona",
  "search": "Szukaj stron...",
  "addSubpage": "Dodaj podstronę",
  "rename": "Zmień nazwę",
  "delete": "Usuń",
  "deleteConfirm": "Czy na pewno chcesz usunąć tę stronę i wszystkie podstrony?",
  "deleted": "Strona usunięta",
  "noPages": "Brak stron. Utwórz pierwszą!",
  "autoSaved": "Zapisano"
}
```

## NPM Dependencies

- `@blocknote/core` — core editor
- `@blocknote/react` — React bindings
- `@blocknote/mantine` — default UI theme (will be restyled to dark)

## TypeScript Types

```typescript
interface WikiPage {
  id: string;
  title: string;
  content?: unknown; // BlockNote JSON
  icon?: string | null;
  parent_id?: string | null;
  sort_order: number;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
  children?: WikiPage[]; // client-side tree building
}
```

## Future Extensions (not in scope)

- Sharing pages with non-OWNER users
- Page templates
- Version history
- Real-time collaborative editing
- Comments on pages
- Embedding pages in tasks
- PDF export
