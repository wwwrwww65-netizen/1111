import { createTRPCReact } from '@trpc/react-query';

// TRPC client typed as any for now to keep mobile decoupled from API typings
export const trpc = createTRPCReact<any>();

