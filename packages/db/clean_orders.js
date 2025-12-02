const { PrismaClient } = require('@prisma/client');

const url = "postgresql://jeeey:Abc1234567890XYZ@127.0.0.1:55432/jeeey?schema=public&connection_limit=15&pool_timeout=30&connect_timeout=5&sslmode=disable";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: url,
        },
    },
});

async function main() {
    console.log('Cleaning up orders...');

    try {
        // Delete dependencies first
        console.log('Deleting ShipmentLegs...');
        await prisma.shipmentLeg.deleteMany({});

        console.log('Deleting Shipments...');
        await prisma.shipment.deleteMany({});

        console.log('Deleting Payments...');
        await prisma.payment.deleteMany({});

        console.log('Deleting OrderItems...');
        await prisma.orderItem.deleteMany({});

        console.log('Deleting CouponUsages...');
        await prisma.couponUsage.deleteMany({});

        console.log('Deleting ReturnRequests...');
        await prisma.returnRequest.deleteMany({});

        console.log('Deleting PointsLedgers (order related)...');
        await prisma.pointsLedger.deleteMany({ where: { orderId: { not: null } } });

        console.log('Deleting WalletLedgers (order related)...');
        await prisma.walletLedger.deleteMany({ where: { orderId: { not: null } } });

        console.log('Deleting Signatures...');
        await prisma.signature.deleteMany({ where: { orderId: { not: null } } });

        console.log('Deleting Events (order related)...');
        await prisma.event.deleteMany({ where: { orderId: { not: null } } });

        // Raw tables
        console.log('Deleting OrderTimeline...');
        try {
            await prisma.$executeRawUnsafe('DELETE FROM "OrderTimeline"');
        } catch (e) {
            console.log('OrderTimeline table might not exist or empty', e.message);
        }

        // Finally delete orders
        console.log('Deleting Orders...');
        await prisma.order.deleteMany({});

        console.log('All orders cleaned up successfully.');
    } catch (e) {
        console.error('Error cleaning orders:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
