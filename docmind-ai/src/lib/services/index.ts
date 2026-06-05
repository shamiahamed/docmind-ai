// Service layer entry point.
// Toggle VITE_API_MODE=live + VITE_API_BASE=https://api.docmind.app/ to hit the FastAPI backend.
import { mockChatStream } from "./mock";
import type { ChatStreamRequest, StreamEvent } from "./types";

const MODE = (import.meta.env.VITE_API_MODE as string) || "mock";
const API_BASE = (import.meta.env.VITE_API_BASE as string) || "";

export async function* streamChat(
  req: ChatStreamRequest,
  token?: string,
): AsyncGenerator<StreamEvent> {
  if (MODE !== "live") {
    yield* mockChatStream(req);
    return;
  }
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(req),
  });
  if (!res.body) throw new Error("No response body");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      try {
        yield JSON.parse(line.slice(5).trim()) as StreamEvent;
      } catch {
        // ignore
      }
    }
  }
}

export type { StreamEvent, ChatStreamRequest } from "./types";
