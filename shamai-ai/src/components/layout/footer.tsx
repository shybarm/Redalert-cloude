import Link from "next/link";

export function Footer() {
  return (
    <footer className="hidden md:block border-t py-6 mt-auto">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} שמאי AI. כל הזכויות שמורות.
        </p>
        <nav className="flex items-center gap-4">
          <Link href="/about" className="hover:text-foreground transition-colors">
            אודות
          </Link>
          <Link href="/about#terms" className="hover:text-foreground transition-colors">
            תנאי שימוש
          </Link>
          <Link href="/about#privacy" className="hover:text-foreground transition-colors">
            פרטיות
          </Link>
        </nav>
      </div>
    </footer>
  );
}
