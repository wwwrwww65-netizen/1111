import { router } from './trpc';
import { productsRouter } from './routers/products';

export const appRouter = router({
  // All sub-routers will be merged here
  products: productsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
