import { db } from '@repo/db';

async function backfill() {
    console.log('Starting Backfill...');

    // 1. Backfill Products (using ProductSeo)
    console.log('Fetching products without SEO...');
    const products = await db.product.findMany({
        where: { seo: { is: null } },
        select: { id: true, name: true }
    });
    console.log(`Found ${products.length} products to backfill.`);

    for (const p of products) {
        let baseSlug = (p.name || 'product')
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
            .replace(/^-+|-+$/g, '');

        if (!baseSlug || baseSlug.length < 2) baseSlug = `product-${p.id.slice(-6)}`;

        // Ensure uniqueness via ID suffix
        const slug = `${baseSlug}-${p.id.slice(-4)}`;

        await db.productSeo.create({
            data: {
                productId: p.id,
                slug,
                seoTitle: p.name,
                seoDescription: p.name
            }
        });
        process.stdout.write('.');
    }
    console.log('\nProducts backfilled.');

    // 2. Backfill Categories (using Category.slug)
    console.log('Fetching categories without slug...');
    const cats = await db.category.findMany({
        where: { slug: null },
        select: { id: true, name: true }
    });
    console.log(`Found ${cats.length} categories to backfill.`);

    for (const c of cats) {
        let baseSlug = (c.name || 'category')
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
            .replace(/^-+|-+$/g, '');

        if (!baseSlug) baseSlug = `cat-${c.id.slice(-4)}`;

        const existing = await db.category.findUnique({ where: { slug: baseSlug } });
        const slug = existing ? `${baseSlug}-${c.id.slice(-4)}` : baseSlug;

        await db.category.update({
            where: { id: c.id },
            data: { slug }
        });
        process.stdout.write('.');
    }

    console.log('\nDone.');
}

backfill()
    .then(() => process.exit(0))
    .catch(e => { console.error(e); process.exit(1); });
