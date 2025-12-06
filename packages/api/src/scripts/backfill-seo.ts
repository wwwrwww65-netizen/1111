import { db } from '@repo/db';

async function main() {
    console.log('Starting SEO Backfill...');

    // 1. Backfill Products
    console.log('Fetching products...');
    const products = await db.product.findMany({
        select: { id: true, name: true, description: true, seo: { select: { slug: true } } },
        where: { isActive: true }
    });

    console.log(`Found ${products.length} products. Processing...`);
    let pCount = 0;
    for (const p of products) {
        if (p.seo && p.seo.slug) continue; // Already good

        const base = String(p.name || 'product').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '');
        const suffix = p.id.slice(-4);
        const slug = `${base}-${suffix}`;

        try {
            await db.productSeo.upsert({
                where: { productId: p.id },
                create: {
                    productId: p.id,
                    slug,
                    seoTitle: p.name,
                    seoDescription: p.description?.slice(0, 160)
                },
                update: {
                    slug
                }
            });
            pCount++;
            if (pCount % 100 === 0) console.log(`Processed ${pCount} products...`);
        } catch (e) {
            console.error(`Failed to backfill product ${p.id}:`, e);
        }
    }
    console.log(`Backfilled ${pCount} products.`);

    // 2. Backfill Categories
    console.log('Fetching categories...');
    const categories = await db.category.findMany({
        select: { id: true, name: true, description: true, slug: true },
    });
    console.log(`Found ${categories.length} categories. Processing...`);
    let cCount = 0;
    for (const c of categories) {
        if (c.slug) continue;

        const base = String(c.name || 'category').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '');
        // Categories usually don't need random suffix if name is unique, but fallback to ID suffix
        const slugBase = base || `cat-${c.id.slice(-4)}`;

        try {
            await retryUpdateCategory(c.id, slugBase);
            cCount++;
        } catch (e) {
            console.error(`Failed to backfill category ${c.id}:`, e);
        }
    }
    console.log(`Backfilled ${cCount} categories.`);
    console.log('Done.');
}

async function retryUpdateCategory(id: string, baseSlug: string, attempt = 0) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
    try {
        await db.category.update({
            where: { id },
            data: { slug }
        });
    } catch (e: any) {
        if (e.code === 'P2002' && attempt < 5) {
            await retryUpdateCategory(id, baseSlug, attempt + 1);
        } else {
            throw e;
        }
    }
}

main().catch(console.error).finally(() => process.exit());
