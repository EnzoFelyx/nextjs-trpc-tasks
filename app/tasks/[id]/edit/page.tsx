import Link from "next/link";
import { TRPCError } from "@trpc/server";
import { createCaller } from "@/trpc/router";
import { TaskForm } from "../../TaskForm";

type Props = {
  params: Promise<{ id: string }>; // in Next 15, route params are async
};

// Server Component: loads the task on the server, like the list page.
export default async function EditTaskPage({ params }: Props) {
  const { id } = await params;

  // byId throws NOT_FOUND for an unknown id; turn only that case into null.
  const task = await createCaller({})
    .task.byId({ id })
    .catch((error) => {
      if (error instanceof TRPCError && error.code === "NOT_FOUND") return null;
      throw error;
    });

  if (!task) {
    return (
      <main>
        <header className="header">
          <h1>Task not found</h1>
        </header>
        <Link href="/">Back to tasks</Link>
      </main>
    );
  }

  return (
    <main>
      <header className="header">
        <h1>Edit task</h1>
      </header>
      <TaskForm task={task} />
    </main>
  );
}
