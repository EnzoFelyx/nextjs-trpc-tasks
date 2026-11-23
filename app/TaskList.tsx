"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import type { Task } from "@/trpc/router";

// "deleted" is a success shown in red; only "error" is announced as an alert.
type Message = { type: "success" | "deleted" | "error"; text: string };

type Props = {
  tasks: Task[];
  saved: boolean; // true right after the form saved a task
};

export function TaskList({ tasks, saved }: Props) {
  const trpc = useTRPC();
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(
    saved ? { type: "success", text: "Task saved" } : null,
  );

  // Remove "?saved=1" from the URL so a page reload does not show the message again.
  useEffect(() => {
    if (saved) window.history.replaceState(null, "", "/");
  }, [saved]);

  // Hide the feedback message after a few seconds.
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timeout);
  }, [message]);

  const deleteTask = useMutation(
    trpc.task.delete.mutationOptions({
      onSuccess: () => {
        setMessage({ type: "deleted", text: "Task deleted" });
        // Re-run the Server Component so the list comes fresh from the server.
        router.refresh();
      },
      onError: (error) => setMessage({ type: "error", text: error.message }),
    }),
  );

  return (
    <>
      {/* Always rendered with a fixed height, so the message appearing or
          disappearing does not push the list up and down. */}
      <div className="message-slot">
        {message && (
          <p
            className={`message ${message.type}`}
            role={message.type === "error" ? "alert" : "status"}
          >
            {message.text}
          </p>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="card">
          No tasks yet. <Link href="/tasks/new">Create your first task</Link>
        </p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => {
            // Stay disabled after success too, until router.refresh() removes the item,
            // so a second click cannot trigger a false "Task not found".
            const isDeleting =
              (deleteTask.isPending || deleteTask.isSuccess) &&
              deleteTask.variables.id === task.id;
            return (
              <li key={task.id} className="card">
                <h2>{task.title}</h2>
                {task.description && <p>{task.description}</p>}
                {/* Server and browser may format dates differently (time zone),
                    so a mismatch here is expected and not a bug. */}
                <time
                  className="muted"
                  dateTime={new Date(task.createdAt).toISOString()}
                  suppressHydrationWarning
                >
                  {new Date(task.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
                <div className="actions">
                  <Link href={`/tasks/${task.id}/edit`} className="button secondary">
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="button secondary"
                    disabled={isDeleting}
                    onClick={() => deleteTask.mutate({ id: task.id })}
                  >
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
