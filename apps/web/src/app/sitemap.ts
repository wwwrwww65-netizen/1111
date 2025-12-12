import { MetadataRoute } from 'next'

export const revalidate = 3600 // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jeeey.com'
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  // fetch top categories and products for sitemap
  // using a reasonable limit to avoid timeout, ideally this should be paginated or streamed if thousands
  let products: any[] = []
  let categories: any[] = []

  try {
    const [prodRes, catRes] = await Promise.all([
      fetch(`${apiUrl}/api/shop/products?limit=1000&select=slug,updatedAt`, { next: { revalidate: 3600 } }),
      fetch(`${apiUrl}/api/shop/categories?limit=1000&select=slug,updatedAt`, { next: { revalidate: 3600 } })
    ])

    if (prodRes.ok) {
      const data = await prodRes.json()
      products = data.products || []
    }
    if (catRes.ok) {
      const data = await catRes.json()
      categories = data.categories || []
    }
  } catch (e) {
    console.error('Sitemap fetch failed', e)
  }

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]

  // Add Categories
  for (const cat of categories) {
    routes.push({
      url: `${siteUrl}/c/${cat.slug || cat.id}`,
      lastModified: new Date(cat.updatedAt || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  // Add Products
  for (const prod of products) {
    routes.push({
      url: `${siteUrl}/p/${prod.slug || prod.id}`,
      lastModified: new Date(prod.updatedAt || Date.now()),
      changeFrequency: 'daily',
      priority: 0.9,
    })
  }

  return routes
}
