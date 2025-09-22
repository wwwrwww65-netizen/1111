import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://jeeey.com'
  const urls: string[] = [
    '/',
  ]
  return urls.map((u)=> ({ url: `${site}${u}`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 }))
}

