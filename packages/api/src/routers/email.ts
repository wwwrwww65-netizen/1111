import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { protectedProcedure } from '../middleware/auth';
import { db } from '@repo/db';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email templates
const emailTemplates = {
  welcome: (name: string, verificationToken: string) => ({
    subject: 'مرحباً بك في منصة التجارة الإلكترونية',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">مرحباً ${name}!</h2>
        <p>شكراً لك على التسجيل في منصتنا. يرجى تأكيد بريدك الإلكتروني بالنقر على الرابط أدناه:</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          تأكيد البريد الإلكتروني
        </a>
        <p>أو انسخ هذا الرابط في المتصفح:</p>
        <p>${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}</p>
        <p>هذا الرابط صالح لمدة 24 ساعة فقط.</p>
      </div>
    `,
  }),

  passwordReset: (name: string, resetToken: string) => ({
    subject: 'إعادة تعيين كلمة المرور',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">مرحباً ${name}</h2>
        <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الرابط أدناه لإعادة تعيين كلمة المرور:</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}" 
           style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          إعادة تعيين كلمة المرور
        </a>
        <p>أو انسخ هذا الرابط في المتصفح:</p>
        <p>${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}</p>
        <p>هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
        <p>إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.</p>
      </div>
    `,
  }),

  orderConfirmation: (order: any, user: any) => ({
    subject: `تأكيد الطلب #${order.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">مرحباً ${user.name}</h2>
        <p>شكراً لك على طلبك! تم استلام طلبك بنجاح.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>تفاصيل الطلب:</h3>
          <p><strong>رقم الطلب:</strong> ${order.id}</p>
          <p><strong>التاريخ:</strong> ${new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
          <p><strong>المجموع:</strong> $${order.total}</p>
          <p><strong>الحالة:</strong> ${order.status}</p>
        </div>

        <p>سنقوم بإرسال تحديثات حول حالة طلبك عبر البريد الإلكتروني.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}" 
           style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          عرض تفاصيل الطلب
        </a>
      </div>
    `,
  }),

  orderShipped: (order: any, user: any, trackingNumber?: string) => ({
    subject: `تم شحن طلبك #${order.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">مرحباً ${user.name}</h2>
        <p>تم شحن طلبك بنجاح!</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>تفاصيل الشحن:</h3>
          <p><strong>رقم الطلب:</strong> ${order.id}</p>
          ${trackingNumber ? `<p><strong>رقم التتبع:</strong> ${trackingNumber}</p>` : ''}
          <p><strong>تاريخ الشحن:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>

        <p>يمكنك تتبع شحنتك من خلال الرابط أدناه:</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}/track" 
           style="background-color: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          تتبع الشحنة
        </a>
      </div>
    `,
  }),

  orderDelivered: (order: any, user: any) => ({
    subject: `تم تسليم طلبك #${order.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">مرحباً ${user.name}</h2>
        <p>تم تسليم طلبك بنجاح!</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>تفاصيل التسليم:</h3>
          <p><strong>رقم الطلب:</strong> ${order.id}</p>
          <p><strong>تاريخ التسليم:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>

        <p>نأمل أن تكون راضياً عن مشترياتك. يمكنك ترك تقييم للمنتجات التي اشتريتها:</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}/review" 
           style="background-color: #ffc107; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          تقييم المنتجات
        </a>
      </div>
    `,
  }),
};

export const emailRouter = router({
  // Send welcome email
  sendWelcomeEmail: publicProcedure
    .input(z.object({ email: z.string().email(), name: z.string() }))
    .mutation(async ({ input }) => {
      const { email, name } = input;

      // Create verification token
      const verificationToken = jwt.sign(
        { email, type: 'email_verification' },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      const template = emailTemplates.welcome(name, verificationToken);

      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: email,
          subject: template.subject,
          html: template.html,
        });

        return { success: true, message: 'Welcome email sent successfully' };
      } catch (error) {
        console.error('Error sending welcome email:', error);
        throw new Error('Failed to send welcome email');
      }
    }),

  // Send password reset email
  sendPasswordResetEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { email } = input;

      // Find user
      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create reset token
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const template = emailTemplates.passwordReset(user.name, resetToken);

      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: email,
          subject: template.subject,
          html: template.html,
        });

        return { success: true, message: 'Password reset email sent successfully' };
      } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
      }
    }),

  // Send order confirmation email
  sendOrderConfirmation: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { orderId } = input;
      const userId = ctx.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const order = await db.order.findFirst({
        where: { id: orderId, userId },
        include: { user: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const template = emailTemplates.orderConfirmation(order, order.user);

      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: order.user.email,
          subject: template.subject,
          html: template.html,
        });

        return { success: true, message: 'Order confirmation email sent successfully' };
      } catch (error) {
        console.error('Error sending order confirmation email:', error);
        throw new Error('Failed to send order confirmation email');
      }
    }),

  // Send order shipped email
  sendOrderShipped: protectedProcedure
    .input(z.object({ orderId: z.string(), trackingNumber: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { orderId, trackingNumber } = input;
      const userId = ctx.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const order = await db.order.findFirst({
        where: { id: orderId, userId },
        include: { user: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const template = emailTemplates.orderShipped(order, order.user, trackingNumber);

      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: order.user.email,
          subject: template.subject,
          html: template.html,
        });

        return { success: true, message: 'Order shipped email sent successfully' };
      } catch (error) {
        console.error('Error sending order shipped email:', error);
        throw new Error('Failed to send order shipped email');
      }
    }),

  // Send order delivered email
  sendOrderDelivered: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { orderId } = input;
      const userId = ctx.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const order = await db.order.findFirst({
        where: { id: orderId, userId },
        include: { user: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const template = emailTemplates.orderDelivered(order, order.user);

      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: order.user.email,
          subject: template.subject,
          html: template.html,
        });

        return { success: true, message: 'Order delivered email sent successfully' };
      } catch (error) {
        console.error('Error sending order delivered email:', error);
        throw new Error('Failed to send order delivered email');
      }
    }),

  // Verify email token
  verifyEmailToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const { token } = input;

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        if (decoded.type !== 'email_verification') {
          throw new Error('Invalid token type');
        }

        const user = await db.user.findUnique({
          where: { email: decoded.email },
        });

        if (!user) {
          throw new Error('User not found');
        }

        await db.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        });

        return { success: true, message: 'Email verified successfully' };
      } catch (error) {
        throw new Error('Invalid or expired token');
      }
    }),

  // Verify password reset token
  verifyPasswordResetToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const { token } = input;

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        if (decoded.type !== 'password_reset') {
          throw new Error('Invalid token type');
        }

        const user = await db.user.findUnique({
          where: { id: decoded.userId },
        });

        if (!user) {
          throw new Error('User not found');
        }

        return { success: true, userId: user.id };
      } catch (error) {
        throw new Error('Invalid or expired token');
      }
    }),
});