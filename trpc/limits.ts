// Shared by the server schema (trpc/router.ts) and the form (app/tasks/TaskForm.tsx).
// Kept in its own file so the form does not import server code into the browser bundle.
export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;
