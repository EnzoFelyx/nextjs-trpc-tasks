import { TaskForm } from "../TaskForm";

export default function NewTaskPage() {
  return (
    <main>
      <header className="header">
        <h1>New task</h1>
      </header>
      <TaskForm />
    </main>
  );
}
