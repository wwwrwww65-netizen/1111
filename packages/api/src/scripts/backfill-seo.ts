
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: Make SEO slug (simplified version of frontend logic)
function makeSeoName(sku: string | null | undefined, name: string): string {
    if (sku) return sku.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (name) return name.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '');
    return `product-${Date.now()}`;
}

// Helper: Clean text (replicating frontend logic strict)
function cleanText(raw: string): string {
    let s = String(raw || '');
    s = s.replace(/<[^>]*>/g, ' '); // HTML
    s = s.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660)); // Numbers
    s = s.replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
    // Strip noise
    const noise = [
        'لايفوتك', 'العرض محدود', 'جديد اليوم', 'حاجة فخمة', 'شغل خارجي', 'تميز', 'تخفيض', 'خصم', 'عرض', 'افضل', 'الأفضل', 'حصري', 'مجاني', 'شحن مجاني',
        'free', 'sale', 'offer', 'best', 'amazing', 'awesome', 'premium', 'original', 'new', '🔥', '👇', '💎', '🤩', '👌',
        'البند', 'القيمة'
    ];
    for (const w of noise) s = s.replace(new RegExp(w, 'gi'), ' ');
    s = s.replace(/[\t\r\n]+/g, ' ');
    return s.trim();
}

async function main() {
    console.log('Starting SEO Backfill...');

    // Fetch all products with necessary relations
    // In chunks of 100 to avoid memory issues
    const chunkSize = 100;
    let skip = 0;
    let processed = 0;

    while (true) {
        const products = await prisma.product.findMany({
            skip,
            take: chunkSize,
            include: {
                seo: true,
                colors: true // needed for primaryImageUrl
            },
            orderBy: { createdAt: 'desc' }
        });

        if (products.length === 0) break;

        for (const p of products) {
            // 1. Determine base values
            // Slug: if seo.slug exists, keep it. Else generate from SKU or Name.
            // Actually frontend logic: if !slug && sku -> makeSeoName(sku).
            let targetSlug = p.seo?.slug;
            if (!targetSlug) {
                targetSlug = makeSeoName(p.sku, p.name);
            }

            // Title: if seo.seoTitle exists, keep it. Else name.
            let targetTitle = p.seo?.seoTitle;
            if (!targetTitle) {
                targetTitle = p.name;
            }

            // Description: if seo.seoDescription exists, keep. Else clean(description).
            let targetDescription = p.seo?.seoDescription;
            if (!targetDescription) {
                const cleaned = cleanText(p.description);
                targetDescription = cleaned.slice(0, 160);
            }

            // Image: Priority: Color marked isPrimary -> First Color primaryImageUrl -> First Image in images[]
            let targetImage = '';
            const primaryColor = p.colors.find(c => c.isPrimary) || p.colors[0];
            if (primaryColor?.primaryImageUrl) {
                targetImage = primaryColor.primaryImageUrl;
            } else if (p.images && p.images.length > 0) {
                targetImage = p.images[0];
            }

            // OG Tags
            let ogTags = p.seo?.ogTags as any || {};
            if (!ogTags.title && targetTitle) ogTags.title = targetTitle;
            if (!ogTags.description && targetDescription) ogTags.description = targetDescription.slice(0, 300);
            // Force update image if we have a better one and it's missing or different (same logic as frontend refinement)
            // Actually strictly: if targetImage is valid, ensure it is set.
            if (targetImage && ogTags.image !== targetImage) {
                ogTags.image = targetImage;
            }

            // Twitter: Not in schema, skipping.
            /*
            let twitterCard = p.seo?.twitterCard as any || {};
            if (!twitterCard.card) twitterCard.card = 'summary_large_image';
            if (!twitterCard.title && targetTitle) twitterCard.title = targetTitle;
            if (!twitterCard.description && targetDescription) twitterCard.description = targetDescription.slice(0, 200);
            if (targetImage && twitterCard.image !== targetImage) {
                twitterCard.image = targetImage;
            }
            */
            let twitterCard = undefined;

            // Upsert SEO record
            // If p.seo exists, update it. If not, create it.
            // But we can just use upsert on productId if relation allows, or explicit update/create.
            // ProductSeo has a unique productId.

            const data = {
                slug: targetSlug,
                seoTitle: targetTitle,
                seoDescription: targetDescription,
                ogTags: ogTags, // Prisma handles Json automatically
                // twitterCard: twitterCard // Not in schema!
            };

            // Upsert SEO record with retry logic for unique slug
            let attempts = 0;
            let currentSlug = targetSlug;

            while (attempts < 3) {
                try {
                    const data = {
                        slug: currentSlug,
                        seoTitle: targetTitle,
                        seoDescription: targetDescription,
                        ogTags: ogTags,
                        twitterCard: twitterCard
                    };

                    // We use upsert on productId if possible, but ProductSeo logic often easier with explicit check if ID known
                    if (p.seo) {
                        await prisma.productSeo.update({ where: { id: p.seo.id }, data });
                    } else {
                        await prisma.productSeo.create({ data: { ...data, productId: p.id } });
                    }
                    break;
                } catch (e: any) {
                    if (e.code === 'P2002' && (e.meta?.target?.includes('slug') || e.message.includes('slug'))) {
                        process.stdout.write('S'); // S = slug collision
                        currentSlug = `${targetSlug}-${Math.floor(Math.random() * 10000)}`;
                        attempts++;
                    } else {
                        console.error(`\nFailed for product ${p.id}: ${e.message}`);
                        break;
                    }
                }
            }
            process.stdout.write('.');
        }
        processed += products.length;
        skip += chunkSize;
        console.log(`\nProcessed ${processed}...`);
    }

    console.log('\nDone!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
