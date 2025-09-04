"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsRouter = void 0;
const zod_1 = require("zod");
const trpc_setup_1 = require("../trpc-setup");
const auth_1 = require("../middleware/auth");
const db_1 = require("@repo/db");
const stripe_1 = __importDefault(require("stripe"));
const isMockPayments = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_MOCK === 'true';
const stripe = !isMockPayments
    ? new stripe_1.default(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
    : null;
// Payment method schemas
const createPaymentIntentSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().default('usd'),
    orderId: zod_1.z.string(),
    paymentMethodId: zod_1.z.string().optional(),
});
const confirmPaymentSchema = zod_1.z.object({
    paymentIntentId: zod_1.z.string(),
    paymentMethodId: zod_1.z.string().optional(),
});
const createCustomerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string(),
    phone: zod_1.z.string().optional(),
});
const createSetupIntentSchema = zod_1.z.object({
    customerId: zod_1.z.string(),
});
const attachPaymentMethodSchema = zod_1.z.object({
    customerId: zod_1.z.string(),
    paymentMethodId: zod_1.z.string(),
});
exports.paymentsRouter = (0, trpc_setup_1.router)({
    // Create payment intent
    createPaymentIntent: auth_1.protectedProcedure
        .input(createPaymentIntentSchema)
        .mutation(async ({ input, ctx }) => {
        var _a;
        const { amount, currency, orderId, paymentMethodId } = input;
        const userId = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            throw new Error('User not authenticated');
        }
        // Verify order belongs to user
        const order = await db_1.db.order.findFirst({
            where: { id: orderId, userId },
            include: { user: true },
        });
        if (!order) {
            throw new Error('Order not found');
        }
        if (isMockPayments) {
            const mockId = `pi_mock_${Date.now()}`;
            await db_1.db.payment.create({
                data: {
                    orderId,
                    amount,
                    currency,
                    method: 'STRIPE',
                    status: 'PENDING',
                    stripeId: mockId,
                },
            });
            return {
                clientSecret: null,
                paymentIntentId: mockId,
                customerId: null,
            };
        }
        // Create or get customer
        let customer;
        if (order.user.stripeCustomerId) {
            customer = await stripe.customers.retrieve(order.user.stripeCustomerId);
        }
        else {
            customer = await stripe.customers.create({
                email: order.user.email,
                name: order.user.name,
                metadata: { userId: order.user.id },
            });
            // Update user with Stripe customer ID
            await db_1.db.user.update({
                where: { id: order.user.id },
                data: { stripeCustomerId: customer.id },
            });
        }
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            customer: customer.id,
            payment_method: paymentMethodId,
            confirm: !!paymentMethodId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
            metadata: {
                orderId,
                userId,
            },
        });
        // Create payment record
        await db_1.db.payment.create({
            data: {
                orderId,
                amount,
                currency,
                method: 'STRIPE',
                status: 'PENDING',
                stripeId: paymentIntent.id,
            },
        });
        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            customerId: customer.id,
        };
    }),
    // Confirm payment
    confirmPayment: auth_1.protectedProcedure
        .input(confirmPaymentSchema)
        .mutation(async ({ input }) => {
        const { paymentIntentId, paymentMethodId } = input;
        if (isMockPayments) {
            await db_1.db.payment.update({ where: { stripeId: paymentIntentId }, data: { status: 'COMPLETED' } });
            const payment = await db_1.db.payment.findUnique({ where: { stripeId: paymentIntentId } });
            if (payment) {
                await db_1.db.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } });
            }
            return { status: 'succeeded', paymentIntent: { id: paymentIntentId } };
        }
        const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
            payment_method: paymentMethodId,
        });
        // Update payment status
        await db_1.db.payment.update({
            where: { stripeId: paymentIntentId },
            data: {
                status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'FAILED',
            },
        });
        // Update order status if payment succeeded
        if (paymentIntent.status === 'succeeded') {
            const payment = await db_1.db.payment.findUnique({
                where: { stripeId: paymentIntentId },
            });
            if (payment) {
                await db_1.db.order.update({
                    where: { id: payment.orderId },
                    data: { status: 'PAID' },
                });
            }
        }
        return {
            status: paymentIntent.status,
            paymentIntent,
        };
    }),
    // Create customer
    createCustomer: auth_1.protectedProcedure
        .input(createCustomerSchema)
        .mutation(async ({ input, ctx }) => {
        var _a;
        const { email, name, phone } = input;
        const userId = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            throw new Error('User not authenticated');
        }
        const customer = await stripe.customers.create({
            email,
            name,
            phone,
            metadata: { userId },
        });
        // Update user with Stripe customer ID
        await db_1.db.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customer.id },
        });
        return { customerId: customer.id };
    }),
    // Create setup intent for saving payment methods
    createSetupIntent: auth_1.protectedProcedure
        .input(createSetupIntentSchema)
        .mutation(async ({ input }) => {
        const { customerId } = input;
        const setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            payment_method_types: ['card'],
            usage: 'off_session',
        });
        return {
            clientSecret: setupIntent.client_secret,
            setupIntentId: setupIntent.id,
        };
    }),
    // Attach payment method to customer
    attachPaymentMethod: auth_1.protectedProcedure
        .input(attachPaymentMethodSchema)
        .mutation(async ({ input }) => {
        const { customerId, paymentMethodId } = input;
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });
        return { success: true };
    }),
    // Get customer payment methods
    getPaymentMethods: auth_1.protectedProcedure
        .query(async ({ ctx }) => {
        var _a;
        const userId = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            throw new Error('User not authenticated');
        }
        const user = await db_1.db.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
        });
        if (!(user === null || user === void 0 ? void 0 : user.stripeCustomerId)) {
            return { paymentMethods: [] };
        }
        const paymentMethods = await stripe.paymentMethods.list({
            customer: user.stripeCustomerId,
            type: 'card',
        });
        return {
            paymentMethods: paymentMethods.data.map(pm => {
                var _a, _b, _c, _d;
                return ({
                    id: pm.id,
                    brand: (_a = pm.card) === null || _a === void 0 ? void 0 : _a.brand,
                    last4: (_b = pm.card) === null || _b === void 0 ? void 0 : _b.last4,
                    expMonth: (_c = pm.card) === null || _c === void 0 ? void 0 : _c.exp_month,
                    expYear: (_d = pm.card) === null || _d === void 0 ? void 0 : _d.exp_year,
                });
            }),
        };
    }),
    // Get payment history
    getPaymentHistory: auth_1.protectedProcedure
        .query(async ({ ctx }) => {
        var _a;
        const userId = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            throw new Error('User not authenticated');
        }
        const payments = await db_1.db.payment.findMany({
            where: { order: { userId } },
            include: {
                order: {
                    select: { id: true, total: true, status: true, createdAt: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return { payments };
    }),
    // Refund payment
    refundPayment: auth_1.protectedProcedure
        .input(zod_1.z.object({ paymentIntentId: zod_1.z.string(), amount: zod_1.z.number().optional() }))
        .mutation(async ({ input }) => {
        const { paymentIntentId, amount } = input;
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount ? Math.round(amount * 100) : undefined,
        });
        // Update payment status
        await db_1.db.payment.update({
            where: { stripeId: paymentIntentId },
            data: { status: 'REFUNDED' },
        });
        return { refund };
    }),
});
//# sourceMappingURL=payments.js.map