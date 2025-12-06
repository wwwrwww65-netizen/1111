require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const id = 'cmiedcz1j008cqvdv47vdso3o';
        console.log('Fetching versions for tab:', id);
        const versions = await prisma.tabPageVersion.findMany({
            where: { tabPageId: id },
            orderBy: { version: 'desc' },
            take: 2
        });

        versions.forEach(v => {
            console.log(`VERSION ${v.version} Content Length:`, v.content ? JSON.stringify(v.content).length : 'NULL');
            if (v.content) console.log(`VERSION ${v.version} SAMPLE:`, JSON.stringify(v.content).substring(0, 200));
        });
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
