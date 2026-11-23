"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTRPCClient } from "@/trpc/client";
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from "@/trpc/limits";
import type { Task } from "@/trpc/router";

type TaskInput = { title: string; description: string };

type Props = {
  task?: Task; // present when editing, absent when creating
};

// One form for both routes: /tasks/new (no task) and /tasks/[id]/edit (with task).
export function TaskForm({ task }: Props) {
  const trpcClient = useTRPCClient();
  const router = useRouter();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [titleError, setTitleError] = useState<string | null>(null);

  const saveTask = useMutation({
    mutationFn: (input: TaskInput) =>
      task
        ? trpcClient.task.update.mutate({ id: task.id, ...input })
        : trpcClient.task.create.mutate(input),
    // Back to the list, which shows the success message (see app/page.tsx).
    onSuccess: () => router.push("/?saved=1"),
  });

  // Stay disabled after success too, until the navigation finishes,
  // so a second click cannot create the task twice.
  const isSaving = saveTask.isPending || saveTask.isSuccess;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Client-side check for fast feedback; the server validates again with Zod.
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }
    setTitleError(null);
    saveTask.mutate({ title, description });
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      {/* Backend errors go on top; the typed values stay in state, so nothing is lost. */}
      {saveTask.error && (
        <p className="message error" role="alert">
          {saveTask.error.message}
        </p>
      )}

      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          maxLength={TITLE_MAX_LENGTH}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setTitleError(null); // hide the error as soon as the user starts fixing it
          }}
          aria-invalid={titleError ? true : undefined}
          aria-describedby={titleError ? "title-error" : undefined}
        />
        {titleError && (
          <p id="title-error" className="field-error" role="alert">
            {titleError}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="description">
          Description <span className="muted">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={4}
          maxLength={DESCRIPTION_MAX_LENGTH}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="actions">
        <button type="submit" className="button" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </button>
        <Link href="/" className="button secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
