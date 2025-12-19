---
description: Updating SEO Implementation for Web Pages
---

To ensure consistent SEO across all pages, specifically when aligning `apps/web` with `apps/mweb`:

1.  **Use Slug-based Routing Logic**:
    - **Important**: To avoid conflicts with existing server deployments that might retain old directories, use `[id]` as the directory name for product pages (`apps/web/src/app/p/[id]`), but treat the parameter as a `slug` in the code.
    - Update `page.tsx` props to assume `params.id` contains the slug (or ID).
    - Update `generateMetadata` to fetch via `slugOrId` using `params.id`.

2.  **Fetch Full SEO Data**:
    - Use common SEO endpoint: `/api/seo/meta?type=[product|category]&slug=${slug}`.
    - Ensure your fetcher supports both slug and ID fallback if needed.
    - Map all fields: `titleSeo`, `metaDescription`, `keywords`, `ogTags` (title, desc, image, url, type), `twitterCard`, `schema`, `hiddenContent`, `alternateLinks`.

3.  **Client-Side Integration**:
    - Ensure `ClientComponent` receives the `slug` (passed as `params.id`) as a prop.
    - Fetch necessary client-side data using this value.
    - Ensure all internal links (e.g., `ProductCard`) point to the slug URL (`/p/[slug]`).

4.  **Verification**:
    - Check DOM for `<title>`, `<meta name="description">`, `<meta property="og:...">`, `application/ld+json`.
    - Check for hidden content div: `<div id="seo-hidden-content">`.
    - Verify Canonical URL matches the slug URL.
