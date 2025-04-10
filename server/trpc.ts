import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { createTRPCContext } from './context';

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.auth?.userId) {
      throw new Error('Unauthorized');
    }

    return next({
      ctx: {
        auth: ctx.auth,
        prisma: ctx.prisma,
      },
    });
  })
);
