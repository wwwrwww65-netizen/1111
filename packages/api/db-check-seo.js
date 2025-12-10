const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DB Check for SEO Data ---');
    try {
        const product = await prisma.product.findFirst({
            where: {
                OR: [
                    { id: 'AGAL-277' },
                    { sku: 'AGAL-277' },
                    { slug: 'AGAL-277' }
                ]
            },
            include: {
                seo: true
            }
        });

        if (!product) {
            console.log('Product not found!');
        } else {
            console.log('Product Found:', product.id, product.name);
            if (product.seo) {
                console.log('SEO Record Found:', JSON.stringify(product.seo, null, 2));
            } else {
                console.log('SEO Record is NULL. This is the issue if Admin says data exists.');
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
