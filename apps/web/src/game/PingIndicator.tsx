import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

const EVERY_MS = 3000;
const GOOD_MS = 80;

export function PingIndicator({ socket }: { socket: Socket | null }) {
  const milliseconds = useRoundTrip(socket);
  if (milliseconds === null) return null;
  return (
    <span
      className={`text-xs tabular-nums ${milliseconds <= GOOD_MS ? "text-muted" : "text-danger"}`}
      title="Time for a message to reach the server and come back"
    >
      {milliseconds} ms
    </span>
  );
}

function useRoundTrip(socket: Socket | null): number | null {
  const [milliseconds, setMilliseconds] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;
    const measure = async () => {
      const started = performance.now();
      try {
        await socket.timeout(2000).emitWithAck("game:ping");
        setMilliseconds(Math.round(performance.now() - started));
      } catch {
        setMilliseconds(null); // no answer: the connection is gone for now
      }
    };
    void measure();
    const timer = setInterval(() => void measure(), EVERY_MS);
    return () => clearInterval(timer);
  }, [socket]);

  return milliseconds;
}