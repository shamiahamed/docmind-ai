export async function apiRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json();
}

export async function streamChat(
  message: string,
  onMessage: (chunk: string) => void
) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  const reader = response.body?.getReader();

  if (!reader) return;

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    onMessage(decoder.decode(value));
  }
}
