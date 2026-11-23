import { initTRPC } from "@trpc/server";

// One tRPC instance for the whole app. No context is needed:
// there is no auth and the data lives in memory on the server.
const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Root router. The task procedures are added in the next step.
export const appRouter = router({});

// Only the type is shared with the client, never the server code.
export type AppRouter = typeof appRouter;
