let lastError: unknown = null;

export function captureError(error: unknown) {
  console.error("Captured error:", error);

  lastError = error;
}

export function consumeLastCapturedError() {
  const error = lastError;

  lastError = null;

  return error;
}
