"use client";

import { type ReactNode, useEffect, useRef } from "react";

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      // Fires for Escape too, so the page state follows whatever the browser does.
      onClose={onClose}
      aria-label={title}
      className="m-auto w-[min(32rem,90vw)] rounded-lg border border-edge bg-panel p-5 text-ink backdrop:bg-surface/70"
    >
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </dialog>
  );
}
