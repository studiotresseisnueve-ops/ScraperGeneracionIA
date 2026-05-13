import { useState, useCallback } from "react";
import { streamProgress } from "../api/client";
import type { ProgressEvent } from "../types";

export function useSSE() {
  const [messages, setMessages] = useState<ProgressEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const connect = useCallback(
    (path: string, onComplete?: () => void) => {
      setMessages([]);
      setRunning(true);
      setDone(false);

      const close = streamProgress(
        path,
        (event) => setMessages((prev) => [...prev, event as ProgressEvent]),
        () => {
          setRunning(false);
          setDone(true);
          onComplete?.();
        }
      );
      return close;
    },
    []
  );

  const reset = useCallback(() => {
    setMessages([]);
    setRunning(false);
    setDone(false);
  }, []);

  return { messages, running, done, connect, reset };
}
