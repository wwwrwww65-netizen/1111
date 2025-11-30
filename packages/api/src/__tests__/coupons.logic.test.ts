
import { couponsRouter } from '../routers/coupons';
import { db } from '@repo/db';

// Mock DB
jest.mock('@repo/db', () => ({
    db: {
        coupon: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        couponUsage: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            deleteMany: jest.fn(),
            count: jest.fn(),
        },
        order: {
            findFirst: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        setting: {
            findUnique: jest.fn(),
        },
        category: {
            findUnique: jest.fn(),
        },
        $transaction: jest.fn((cb) => cb({
            couponUsage: { findUnique: jest.fn(), create: jest.fn() },
            order: { update: jest.fn() },
            $executeRawUnsafe: jest.fn(() => true),
        })),
    },
}));

describe('Coupons Router Logic', () => {
    const mockCtx = { user: { userId: 'user1' } };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should calculate discount only on eligible items', async () => {
        // Setup Coupon
        const coupon = {
            id: 'c1',
            code: 'TARGETED',
            isActive: true,
            validFrom: new Date(Date.now() - 10000),
            validUntil: new Date(Date.now() + 10000),
            discountType: 'PERCENTAGE',
            discountValue: 10, // 10%
            minOrderAmount: 0,
            currentUses: 0,
            maxUses: 100,
        };
        (db.coupon.findUnique as jest.Mock).mockResolvedValue(coupon);

        // Setup Rules (Targeting Category 'cat1')
        const rules = {
            enabled: true,
            includes: ['category:cat1'],
        };
        (db.setting.findUnique as jest.Mock).mockResolvedValue({ value: rules });

        // Setup Order
        const order = {
            id: 'o1',
            userId: 'user1',
            items: [
                { productId: 'p1', price: 100, quantity: 1, product: { categoryId: 'cat1' } }, // Eligible
                { productId: 'p2', price: 50, quantity: 1, product: { categoryId: 'cat2' } },  // Not Eligible
            ],
            user: { email: 'test@test.com' }
        };
        (db.order.findFirst as jest.Mock).mockResolvedValue(order);

        // Call applyCoupon
        const caller = couponsRouter.createCaller(mockCtx as any);
        const result = await caller.applyCoupon({
            couponCode: 'TARGETED',
            orderTotal: 150,
            orderId: 'o1',
        });

        // Expect discount to be 10% of 100 (eligible item) = 10
        // NOT 10% of 150 = 15
        expect(result.discountAmount).toBe(10);
    }, 30000);

    it('should apply to all items if no targeting rules', async () => {
        // Setup Coupon
        const coupon = {
            id: 'c2',
            code: 'GENERAL',
            isActive: true,
            validFrom: new Date(Date.now() - 10000),
            validUntil: new Date(Date.now() + 10000),
            discountType: 'PERCENTAGE',
            discountValue: 10, // 10%
            minOrderAmount: 0,
            currentUses: 0,
            maxUses: 100,
        };
        (db.coupon.findUnique as jest.Mock).mockResolvedValue(coupon);

        // No Rules
        (db.setting.findUnique as jest.Mock).mockResolvedValue(null);

        // Setup Order
        const order = {
            id: 'o2',
            userId: 'user1',
            items: [
                { productId: 'p1', price: 100, quantity: 1, product: { categoryId: 'cat1' } },
                { productId: 'p2', price: 50, quantity: 1, product: { categoryId: 'cat2' } },
            ],
            user: { email: 'test@test.com' }
        };
        (db.order.findFirst as jest.Mock).mockResolvedValue(order);

        // Call applyCoupon
        const caller = couponsRouter.createCaller(mockCtx as any);
        const result = await caller.applyCoupon({
            couponCode: 'GENERAL',
            orderTotal: 150,
            orderId: 'o2',
        });

        // Expect discount to be 10% of 150 = 15
        expect(result.discountAmount).toBe(15);
    }, 30000);
});
