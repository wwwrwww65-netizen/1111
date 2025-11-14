import { createTRPCReact } from '@trpc/react-query';

// TRPC client typed as any for now to keep mobile decoupled from API typings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpc = createTRPCReact<any>();

