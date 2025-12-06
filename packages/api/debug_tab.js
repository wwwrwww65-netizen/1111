require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const id = 'cmiedcz1j008cqvdv47vdso3o';
        console.log('Fetching tab:', id);
        const tab = await prisma.tabPage.findUnique({
            where: { id },
            include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
        });
        console.log('TAB FOUND:', !!tab);
        if (tab) {
            console.log('CONTENT LENGTH:', tab.content ? JSON.stringify(tab.content).length : 0);
            console.log('LATEST VERSION:', tab.versions[0]?.version);
            // Print content sample
            console.log('CONTENT SAMPLE:', JSON.stringify(tab.content).substring(0, 500));
        } else {
            console.log('TAB NOT FOUND');
        }
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
