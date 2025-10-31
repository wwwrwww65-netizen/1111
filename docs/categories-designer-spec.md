## Categories Designer Revamp

### Objectives
- Enable merchants to manage categories page content without technical intervention.
- Focus workflow on per-tab configuration, ensuring every sidebar item can be fully customized (banner, featured slides, grid, suggestions).
- Deliver contemporary UX built with current admin design system components while remaining compatible with existing data model and APIs.

### Target Experience Summary
1. **Tabs Workspace**
   - Create, rename, delete, and reorder tabs.
   - Each tab exposes: featured slider, tab-level grid, tab-level banner.
2. **Sidebar Items Builder**
   - Per tab, manage a sortable list of sidebar items.
   - Each item allows banner configuration, featured slides, grid (explicit/filter), and per-item suggestions block.
3. **Media & Categories Pickers**
   - Shared modals for media selections (drag & drop + library) and category selection with live search and multi-select.
4. **Draft → Publish Flow**
   - Inline saves update draft (`categoriesPage:{site}:draft`), publish copies to live key, with audit logging.
   - Live preview through signed token shared with storefront for instant verification.

### Data Model (TypeScript)
```ts
type CategoryMini = { id: string; name: string; image?: string };
type PromoBanner = { enabled: boolean; image?: string; title?: string; href?: string };
type ExplicitGrid = { mode: "explicit"; categories: CategoryMini[] };
type FilterGrid = { mode: "filter"; categoryIds?: string[]; limit?: number; sortBy?: "name_asc"|"name_desc"|"created_desc" };
type GridConfig = ExplicitGrid | FilterGrid;
type SuggestionsBlock = { enabled: boolean; title?: string; items?: CategoryMini[] };
type SidebarItemConfig = {
  label: string;
  href?: string;
  promoBanner?: PromoBanner;
  featured?: CategoryMini[];
  grid?: GridConfig;
  suggestions?: SuggestionsBlock;
};
type TabConfig = {
  key: string;
  label: string;
  promoBanner?: PromoBanner;
  featured?: CategoryMini[];
  grid?: GridConfig;
  sidebarItems: SidebarItemConfig[];
};
type CategoriesPageConfig = {
  layout?: { showHeader?: boolean; showTabs?: boolean; showSidebar?: boolean; showPromoPopup?: boolean };
  tabs: TabConfig[];
  suggestions?: SuggestionsBlock | CategoryMini[];
  badges?: Array<{ categoryId: string; text: string }>;
  seo?: { title?: string; description?: string };
};
```

### API Contracts
- `GET /api/admin/categories/page?site={site}&mode={draft|live}` → returns `CategoriesPageConfig`.
- `PUT /api/admin/categories/page` body `{ site, mode:'draft', config }` → validates against schema, upserts draft key, audits `categories_page.save`.
- `POST /api/admin/categories/page/publish` `{ site }` → copies draft → live, audits `categories_page.publish`.
- `POST /api/admin/categories/page/preview/sign` `{ content }` → returns `{ token, exp }`, stores token payload for 5 minutes.
- `GET /api/categories/page?site={site}` → storefront consumes live config.

### Admin UI Architecture
- **Stack**: Next.js App Router, React 18, TypeScript, Tailwind, existing design system components.
- **State**: React Query for data fetching & mutations; Zod validation before save/publish.
- **Drag & Drop**: `@dnd-kit/sortable` for tab and sidebar item ordering.
- **Pickers**:
  - `CategoriesPickerModal`: supports live search, multi-select, badges with thumbnails, reuses across featured/grid/suggestions.
  - `MediaPickerModal`: drag & drop area, uploads to `/api/admin/media`, pagination, selects image URL.
- **Preview**: iframe pinned on the right column, uses signed token and `postMessage` updates.

### User Flow
1. Select site (mweb/web).
2. Manage tabs via accordion UI; each accordion contains sidebar list builder.
3. For each sidebar item configure:
   - Banner (toggle, title, href, image pick).
   - Featured slider (select categories).
   - Grid (choose explicit/filter, configure content).
   - Suggestions block (toggle, title, select categories).
4. Save persists draft; success toast shown. Undo handled via optimistic updates & local history snapshot.
5. Publish copies draft to live; success toast indicates production update.
6. Preview button opens storefront with preview token.

### Validation & Error Handling
- Schema guard (Zod) ensures keys, labels, and arrays exist (`sidebarItems` defaults to []).
- UI prevents save when duplicate tab keys or empty labels.
- Picks for categories enforce unique IDs and max list sizes (configurable, default 50).

### Testing Strategy
- **API**: Jest + Supertest covering save, publish, preview token.
- **UI**: React Testing Library for critical interactions (adding tab/item, per-item banner toggle).
- **E2E**: Playwright scenario verifying full workflow (create tab → add sidebar item → configure blocks → publish → preview displays selections).

### Deployment Notes
- No schema migrations required.
- Ensure CI runs `pnpm lint`, `pnpm test`, `pnpm build` before deploy.
- Publish caches invalidated within 60s on storefront due to `Cache-Control` header.
