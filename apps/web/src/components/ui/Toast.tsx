import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from "react";

export type ToastTone = "info" | "error";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const VISIBLE_MS = 5000;
const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastId = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = "info") => {
    const id = ++lastId.current;
    setToasts((list) => [...list, { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), VISIBLE_MS);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <ToastRegion toasts={toasts} />
    </ToastContext.Provider>
  );
}

/** Raises a message. Only inside <ToastProvider>, which the root layout mounts. */
export function useToast(): (message: string, tone?: ToastTone) => void {
  const show = useContext(ToastContext);
  if (!show) {
    throw new Error("useToast() needs a <ToastProvider> above it");
  }
  return show;
}

function ToastRegion({ toasts }: { toasts: readonly Toast[] }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <p
          key={toast.id}
          className={`rounded-md border bg-panel px-4 py-2 text-sm shadow-lg ${
            toast.tone === "error" ? "border-danger text-danger" : "border-edge text-ink"
          }`}
        >
          {toast.message}
        </p>
      ))}
    </div>
  );
}
