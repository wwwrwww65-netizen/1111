import { router } from './trpc';
import { productsRouter } from './routers/products';
import { authRouter } from './routers/auth';

export const appRouter = router({
  // All sub-routers will be merged here
  auth: authRouter,
  products: productsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
