import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { protectedProcedure } from '../middleware/auth';
import { db } from '@repo/db';
import Stripe from 'stripe';

const isMockPayments = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_MOCK === 'true';
const stripe = !isMockPayments
  ? new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' })
  : (null as unknown as Stripe);

// Payment method schemas
const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('usd'),
  orderId: z.string(),
  paymentMethodId: z.string().optional(),
});

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  paymentMethodId: z.string().optional(),
});

const createCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
});

const createSetupIntentSchema = z.object({
  customerId: z.string(),
});

const attachPaymentMethodSchema = z.object({
  customerId: z.string(),
  paymentMethodId: z.string(),
});

export const paymentsRouter = router({
  // Create payment intent
  createPaymentIntent: protectedProcedure
    .input(createPaymentIntentSchema)
    .mutation(async ({ input, ctx }) => {
      const { amount, currency, orderId, paymentMethodId } = input;
      const userId = ctx.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Verify order belongs to user
      const order = await db.order.findFirst({
        where: { id: orderId, userId },
        include: { user: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (isMockPayments) {
        const mockId = `pi_mock_${Date.now()}`;
        await db.payment.create({
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
      if ((order.user as any).stripeCustomerId) {
        customer = await stripe.customers.retrieve((order.user as any).stripeCustomerId as any);
      } else {
        customer = await stripe.customers.create({
          email: order.user.email,
          name: order.user.name,
          metadata: { userId: order.user.id },
        });

        // Update user with Stripe customer ID
        await db.user.update({
          where: { id: order.user.id },
          data: { stripeCustomerId: (customer as any).id },
        });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: (customer as any).id,
        payment_method: paymentMethodId,
        confirm: !!paymentMethodId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        metadata: {
          orderId,
          userId,
        },
      });

      // Create payment record
      await db.payment.create({
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
        customerId: (customer as any).id,
      };
    }),

  // Confirm payment
  confirmPayment: protectedProcedure
    .input(confirmPaymentSchema)
    .mutation(async ({ input }) => {
      const { paymentIntentId, paymentMethodId } = input;
      if (isMockPayments) {
        await db.payment.update({ where: { stripeId: paymentIntentId }, data: { status: 'COMPLETED' } });
        const payment = await db.payment.findUnique({ where: { stripeId: paymentIntentId } });
        if (payment) {
          await db.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } });
        }
        return { status: 'succeeded', paymentIntent: { id: paymentIntentId } } as any;
      }

      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      // Update payment status
      await db.payment.update({
        where: { stripeId: paymentIntentId },
        data: {
          status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'FAILED',
        },
      });

      // Update order status if payment succeeded
      if (paymentIntent.status === 'succeeded') {
        const payment = await db.payment.findUnique({
          where: { stripeId: paymentIntentId },
        });

        if (payment) {
          await db.order.update({
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
  createCustomer: protectedProcedure
    .input(createCustomerSchema)
    .mutation(async ({ input, ctx }) => {
      const { email, name, phone } = input;
      const userId = ctx.user?.userId;

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
      await db.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });

      return { customerId: customer.id };
    }),

  // Create setup intent for saving payment methods
  createSetupIntent: protectedProcedure
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
  attachPaymentMethod: protectedProcedure
    .input(attachPaymentMethodSchema)
    .mutation(async ({ input }) => {
      const { customerId, paymentMethodId } = input;

      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      return { success: true };
    }),

  // Get customer payment methods
  getPaymentMethods: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
      });

      if (!user?.stripeCustomerId) {
        return { paymentMethods: [] };
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      return {
        paymentMethods: paymentMethods.data.map(pm => ({
          id: pm.id,
          brand: pm.card?.brand,
          last4: pm.card?.last4,
          expMonth: pm.card?.exp_month,
          expYear: pm.card?.exp_year,
        })),
      };
    }),

  // Get payment history
  getPaymentHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const payments = await db.payment.findMany({
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
  refundPayment: protectedProcedure
    .input(z.object({ paymentIntentId: z.string(), amount: z.number().optional() }))
    .mutation(async ({ input }) => {
      const { paymentIntentId, amount } = input;

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      // Update payment status
      await db.payment.update({
        where: { stripeId: paymentIntentId },
        data: { status: 'REFUNDED' },
      });

      return { refund };
    }),
});