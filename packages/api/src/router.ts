import { router } from './trpc';
import { productsRouter } from './routers/products';
import { authRouter } from './routers/auth';
import { paymentsRouter } from './routers/payments';
import { emailRouter } from './routers/email';
import { searchRouter } from './routers/search';
import { adminRouter } from './routers/admin';
import { wishlistRouter } from './routers/wishlist';
import { couponsRouter } from './routers/coupons';

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
});

export type AppRouter = typeof appRouter;
