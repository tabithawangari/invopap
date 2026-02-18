// app/not-found.tsx — Custom 404 page
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist/30 px-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-6xl font-display font-bold text-lagoon">404</h1>
        <p className="text-lg text-ink/60">Page not found</p>
        <p className="text-sm text-ink/40">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
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
