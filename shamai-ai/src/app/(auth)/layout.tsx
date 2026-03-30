import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
      <Link
        href="/"
        className="flex items-center gap-2 font-bold text-2xl mb-8"
      >
        <span className="text-primary">שמאי</span>
        <span className="text-muted-foreground">AI</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
