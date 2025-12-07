
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Searching for product with SKU "AGAL-24" (or similar)...');

    // 1. Find by SKU (try exact, then contains)
    let p = await prisma.product.findFirst({
        where: { sku: { equals: 'AGAL-24', mode: 'insensitive' } },
        include: { seo: true }
    });

    if (!p) {
        console.log('Not found by exact SKU. Searching contains...');
        p = await prisma.product.findFirst({
            where: { sku: { contains: 'AGAL-24', mode: 'insensitive' } },
            include: { seo: true }
        });
    }

    if (!p) {
        console.error('ERROR: Product AGAL-24 not found in database!');
        return;
    }

    console.log(`\nFOUND PRODUCT:`);
    console.log(`ID: ${p.id}`);
    console.log(`Name: ${p.name}`);
    console.log(`SKU: ${p.sku}`);
    console.log(`---------- SEO RECORD ----------`);
    if (p.seo) {
        console.log(`SEO ID: ${p.seo.id}`);
        console.log(`Slug: '${p.seo.slug}'`);
        console.log(`Title: '${p.seo.seoTitle}'`);
        console.log(`Description Length: ${p.seo.seoDescription?.length}`);
        console.log(`OG Tags: ${JSON.stringify(p.seo.ogTags, null, 2)}`);
    } else {
        console.error('ERROR: Product has NO SEO record (p.seo is null).');
    }
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => await prisma.$disconnect());
