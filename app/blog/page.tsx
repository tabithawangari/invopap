import Link from "next/link";

export default function BlogPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist/30 px-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-4xl font-display font-bold text-lagoon">Blog</h1>
        <p className="text-lg text-ink/60">Coming soon.</p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-lagoon px-6 py-3 text-sm font-medium text-white hover:bg-lagoon/90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
