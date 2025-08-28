import { router } from './trpc-setup';
import { productsRouter } from './routers/products';
import { authRouter } from './routers/auth';
import { paymentsRouter } from './routers/payments';
import { emailRouter } from './routers/email';
import { searchRouter } from './routers/search';
import { adminRouter } from './routers/admin';
import { wishlistRouter } from './routers/wishlist';
import { couponsRouter } from './routers/coupons';
import { cartRouter } from './routers/cart';
import { ordersRouter } from './routers/orders';

export const appRouter = router({
  // All sub-routers will be merged here
  auth: authRouter,
  products: productsRouter,
  payments: paymentsRouter,
  email: emailRouter,
  search: searchRouter,
  admin: adminRouter,
  wishlist: wishlistRouter,
  coupons: couponsRouter,
  cart: cartRouter,
  orders: ordersRouter,
});

export type AppRouter = typeof appRouter;
