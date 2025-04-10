import { router } from '../trpc';
import { companyRouter } from './company';

export const appRouter = router({
  company: companyRouter,
});

// Type definition for frontend autocompletion
export type AppRouter = typeof appRouter;
