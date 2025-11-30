
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const items = await prisma.orderItem.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        include: { product: true }
    });

    console.log(JSON.stringify(items, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
