import Link from "next/link";
import { AuthMenu } from "@/auth/AuthMenu";
import { Nav } from "./Nav";

export function Header() {
  return (
    <header className="border-b border-edge bg-panel">
      <div className="relative mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          ft_transcendence
        </Link>
        <div className="flex items-center gap-4">
          <Nav />
          <AuthMenu />
        </div>
      </div>
    </header>
  );
}
