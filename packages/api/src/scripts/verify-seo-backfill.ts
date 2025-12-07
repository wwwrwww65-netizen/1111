
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying SEO Backfill...');

    const totalProducts = await prisma.product.count();
    const productsWithSeo = await prisma.product.count({
        where: { seo: { isNot: null } }
    });

    const productsWithSlug = await prisma.productSeo.count({
        where: { slug: { not: null } }
    });

    // const productsWithOgImage = await prisma.productSeo.count({
    //     where: {
    //         ogTags: {
    //             path: ['image'],
    //             not: Prisma.DbNull
    //         }
    //     }
    // });
    const productsWithOgImage = 0; // Disabled due to TS strict check on build

    console.log(`\n--- Stats ---`);
    console.log(`Total Products: ${totalProducts}`);
    console.log(`Products with SEO Record: ${productsWithSeo}`);
    console.log(`Products with Slug: ${productsWithSlug}`);
    // Note: accurate JSON path querying depends on DB support, counting raw valid JSONs with image might be safer via sampling if this fails, but let's try.

    console.log(`\n--- Sampling 5 Random Products ---`);
    const samples = await prisma.product.findMany({
        take: 5,
        include: { seo: true },
        orderBy: { updatedAt: 'desc' } // show recently updated (which should be all of them)
    });

    for (const p of samples) {
        console.log(`\nProduct: ${p.name.slice(0, 30)}... (ID: ${p.id})`);
        console.log(`  Wrapper Exists: ${!!p.seo}`);
        if (p.seo) {
            console.log(`  Slug: ${p.seo.slug}`);
            console.log(`  Title: ${p.seo.seoTitle}`);
            console.log(`  Desc: ${p.seo.seoDescription?.slice(0, 50)}...`);
            console.log(`  OG Tags: ${JSON.stringify(p.seo.ogTags)}`);
        }
    }

    if (productsWithSeo < totalProducts) {
        console.warn(`\nWARNING: ${totalProducts - productsWithSeo} products are missing SEO records!`);
    } else {
        console.log(`\nSUCCESS: All products have SEO records.`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
