require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        console.log('Testing DB connection...');
        const start = Date.now();
        const c = await prisma.category.findFirst({ select: { id: true } });
        console.log('DB Connection OK. Latency:', Date.now() - start, 'ms');
        console.log('Sample ID:', c?.id);
    } catch (e) {
        console.error('DB Connection FAILED:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
run();
