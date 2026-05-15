export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Page not found
      </p>
      <a href="/" className="mt-4 text-primary hover:underline">
        Go back home
      </a>
    </div>
  );
}
