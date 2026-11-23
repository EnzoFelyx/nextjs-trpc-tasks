import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/trpc/router";

// Exposes every tRPC procedure under /api/trpc/<procedure>.
// Queries arrive as GET and mutations as POST, so both use the same handler.
function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
  });
}

export { handler as GET, handler as POST };
