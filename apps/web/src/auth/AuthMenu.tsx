"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { logout } from "./api";
import { useAuth } from "./AuthProvider";

export function AuthMenu() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const toast = useToast();

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/login" className="text-muted hover:text-ink">
          Log in
        </Link>
        <Link href="/signup">
          <Button>Sign up</Button>
        </Link>
      </div>
    );
  }

  const onLogout = async () => {
    await logout();
    await refresh();
    toast("Signed out");
    router.push("/");
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden text-muted sm:inline">{user.email}</span>
      <Button variant="secondary" onClick={onLogout}>
        Log out
      </Button>
    </div>
  );
}