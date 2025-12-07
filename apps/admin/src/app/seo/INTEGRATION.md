# SEO Integration Configuration

## Google Search Console

### Method 1: HTML Meta Tag
Add this to your site's `<head>`:
```html
<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
```

### Method 2: HTML File
Upload `google[code].html` to your site root.

### Method 3: DNS Record
Add TXT record to your domain:
```
google-site-verification=YOUR_CODE
```

## Bing Webmaster Tools

### HTML Meta Tag
```html
<meta name="msvalidate.01" content="YOUR_BING_CODE" />
```

## Sitemap Configuration

### Auto-generated Sitemap
Your sitemap will be available at:
```
https://yoursite.com/sitemap.xml
```

### Submit to Search Engines
- Google: https://search.google.com/search-console
- Bing: https://www.bing.com/webmasters

## Robots.txt

Default configuration:
```
User-agent: *
Allow: /
Sitemap: https://yoursite.com/sitemap.xml
```

## Schema.org Templates

### Organization
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company Name",
  "url": "https://yoursite.com",
  "logo": "https://yoursite.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+966-XX-XXX-XXXX",
    "contactType": "customer service"
  },
  "sameAs": [
    "https://www.facebook.com/yourpage",
    "https://twitter.com/yourhandle",
    "https://www.instagram.com/yourhandle"
  ]
}
```

### Product
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "image": "https://yoursite.com/product.jpg",
  "description": "Product description",
  "brand": {
    "@type": "Brand",
    "name": "Brand Name"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://yoursite.com/product",
    "priceCurrency": "SAR",
    "price": "99.00",
    "availability": "https://schema.org/InStock"
  }
}
```

### Article
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title",
  "image": "https://yoursite.com/article.jpg",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Publisher Name",
    "logo": {
      "@type": "ImageObject",
      "url": "https://yoursite.com/logo.png"
    }
  },
  "datePublished": "2025-12-04",
  "dateModified": "2025-12-04"
}
```

### Breadcrumbs
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://yoursite.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Category",
      "item": "https://yoursite.com/category"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Product",
      "item": "https://yoursite.com/category/product"
    }
  ]
}
```

## Open Graph (Facebook) Best Practices

### Required Tags
```html
<meta property="og:title" content="Page Title" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://yoursite.com/page" />
<meta property="og:image" content="https://yoursite.com/image.jpg" />
```

### Recommended Tags
```html
<meta property="og:description" content="Page description" />
<meta property="og:site_name" content="Your Site Name" />
<meta property="og:locale" content="ar_SA" />
```

### Image Specifications
- Recommended size: 1200 x 630 pixels
- Minimum size: 600 x 315 pixels
- Aspect ratio: 1.91:1
- Format: JPG or PNG

## Twitter Card

### Summary Card
```html
<meta name="twitter:card" content="summary" />
<meta name="twitter:site" content="@yourhandle" />
<meta name="twitter:title" content="Page Title" />
<meta name="twitter:description" content="Page description" />
<meta name="twitter:image" content="https://yoursite.com/image.jpg" />
```

### Summary Card with Large Image
```html
<meta name="twitter:card" content="summary_large_image" />
```

## Analytics Integration

### Google Analytics 4
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Google Tag Manager
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

## Performance Monitoring

### Core Web Vitals
Monitor these metrics:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Tools
- Google PageSpeed Insights
- Lighthouse
- Web Vitals Chrome Extension

## Security Headers

### Content Security Policy
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
```

### X-Robots-Tag
```
X-Robots-Tag: index, follow
```

## Internationalization (i18n)

### hreflang Tags
```html
<link rel="alternate" hreflang="ar" href="https://yoursite.com/ar/page" />
<link rel="alternate" hreflang="en" href="https://yoursite.com/en/page" />
<link rel="alternate" hreflang="x-default" href="https://yoursite.com/page" />
```

## Monitoring & Reporting

### Weekly Checklist
- [ ] Check Google Search Console for errors
- [ ] Review indexing status
- [ ] Monitor Core Web Vitals
- [ ] Check for broken links
- [ ] Review top performing pages
- [ ] Analyze search queries

### Monthly Tasks
- [ ] Update sitemap
- [ ] Review and update meta descriptions
- [ ] Check competitor rankings
- [ ] Update schema markup
- [ ] Review analytics data

---

**Note**: Replace placeholder values (YOUR_CODE, XXXXXXXXXX, etc.) with your actual codes and IDs.
