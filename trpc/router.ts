import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

// One tRPC instance for the whole app. No context is needed:
// there is no auth and the data lives in memory on the server.
const t = initTRPC.create({
  // By default a Zod failure arrives at the client as a JSON dump of issues.
  // Join the issue messages instead, so the UI can show e.g. "Title is required".
  errorFormatter({ shape, error }) {
    if (error.cause instanceof z.ZodError) {
      const message = error.cause.issues.map((issue) => issue.message).join(", ");
      return { ...shape, message };
    }
    return shape;
  },
});

export type Task = {
  id: string;
  title: string;
  description?: string;
  createdAt: number; // Unix timestamp in ms: plain JSON, no Date serializer needed
};

// In-memory store. A Map keeps insertion order and gives direct get/delete by id.
// In dev, Next re-runs modules on hot reload, which would reset a module-level
// variable; globalThis survives those reloads, so tasks last until the server stops.
const globalForTasks = globalThis as typeof globalThis & { tasks?: Map<string, Task> };
const tasks = (globalForTasks.tasks ??= new Map<string, Task>());

function findTask(id: string): Task {
  const task = tasks.get(id);
  if (!task) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
  }
  return task;
}

const idInput = z.object({ id: z.string() });

// trim() first so a title made only of spaces is rejected too.
const taskInput = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
});

export const appRouter = t.router({
  task: t.router({
    // Newest first.
    list: t.procedure.query(() => Array.from(tasks.values()).reverse()),

    // Used by the edit page to load the task (NOT_FOUND if the id does not exist).
    byId: t.procedure.input(idInput).query(({ input }) => findTask(input.id)),

    create: t.procedure.input(taskInput).mutation(({ input }) => {
      const task: Task = {
        id: crypto.randomUUID(),
        title: input.title,
        description: input.description,
        createdAt: Date.now(),
      };
      tasks.set(task.id, task);
      return task;
    }),

    // The form always sends title and description, so update replaces both.
    update: t.procedure.input(taskInput.extend(idInput.shape)).mutation(({ input }) => {
      const task: Task = {
        ...findTask(input.id),
        title: input.title,
        description: input.description,
      };
      tasks.set(task.id, task);
      return task;
    }),

    delete: t.procedure.input(idInput).mutation(({ input }) => {
      if (!tasks.delete(input.id)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      return { id: input.id };
    }),
  }),
});

// Only the type is shared with the client, never the server code.
export type AppRouter = typeof appRouter;
