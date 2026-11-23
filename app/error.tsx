"use client";

import Link from "next/link";

// Next.js error boundary: shown instead of the default "Application error"
// screen when a page fails to render (e.g. an unexpected server error).
export default function ErrorPage() {
  return (
    <main>
      <header className="header">
        <h1>Something went wrong</h1>
      </header>
      <p className="message error" role="alert">
        The page could not be loaded. Please try again.
      </p>
      <Link href="/">Back to tasks</Link>
    </main>
  );
}
