"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { uploadAvatar } from "./api";

export function AvatarUpload({ currentUrl }: { currentUrl: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { busy, send } = useUpload(file, () => {
    setFile(null);
    setPreview(null);
  });

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0] ?? null;
    setFile(chosen);
    setPreview(chosen ? URL.createObjectURL(chosen) : null);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Image
        src={preview ?? currentUrl}
        alt=""
        width={72}
        height={72}
        unoptimized
        className="rounded-full border border-edge"
      />
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={choose}
        aria-label="Choose a picture"
        className="text-sm text-muted file:mr-3 file:rounded-md file:border file:border-edge file:bg-panel file:px-3 file:py-1.5 file:text-ink"
      />
      <Button onClick={send} disabled={!file || busy}>
        {busy ? "Uploading…" : "Upload"}
      </Button>
    </div>
  );
}

function useUpload(file: File | null, done: () => void) {
  const [busy, setBusy] = useState(false);
  const { refresh } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const send = async () => {
    if (!file) return;
    setBusy(true);
    try {
      await uploadAvatar(file);
      await refresh();
      router.refresh(); 
      done();
      toast("Avatar updated");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Upload failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return { busy, send };
}