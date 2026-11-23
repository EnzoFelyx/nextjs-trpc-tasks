import Link from "next/link";
import { createCaller } from "@/trpc/router";
import { TaskList } from "./TaskList";

// The tasks change at runtime, so render on every request instead of at build time.
export const dynamic = "force-dynamic";

// Server Component: the list is loaded on the server (SSR), so the first
// render already has the data and needs no loading state.
export default async function HomePage() {
  const tasks = await createCaller({}).task.list();

  return (
    <main>
      <header className="header">
        <h1>Tasks</h1>
        <Link href="/tasks/new" className="button">
          New task
        </Link>
      </header>
      <TaskList tasks={tasks} />
    </main>
  );
}
