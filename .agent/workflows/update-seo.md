---
description: Updating SEO Implementation for Web Pages
---

To ensure consistent SEO across all pages, specifically when aligning `apps/web` with `apps/mweb`:

1.  **Use Slug-based Routing**:
    - Avoid `/p/[id]` or `/c/[id]`. Use `/p/[slug]` and `/c/[slug]`.
    - Update directory names in `app/`.
    - Update `generateMetadata` to fetch via slug.

2.  **Fetch Full SEO Data**:
    - Use common SEO endpoint: `/api/seo/meta?type=[product|category]&slug=${slug}`.
    - Ensure your fetcher supports both slug and ID fallback if needed.
    - Map all fields: `titleSeo`, `metaDescription`, `keywords`, `ogTags` (title, desc, image, url, type), `twitterCard`, `schema`, `hiddenContent`, `alternateLinks`.

3.  **Client-Side Integration**:
    - Ensure `ClientComponent` receives `slug` as prop.
    - Fetch necessary client-side data using `slug`.
    - Ensure all internal links (e.g., `ProductCard`) point to the slug URL.

4.  **Verification**:
    - Check DOM for `<title>`, `<meta name="description">`, `<meta property="og:...">`, `application/ld+json`.
    - Check for hidden content div: `<div id="seo-hidden-content">`.
    - Verify Canonical URL matches the slug URL.
