import React from "react";

export function renderErrorPage(error?: unknown) {
  return `
    <html>
      <body style="font-family:sans-serif;padding:40px;">
        <h1>Something went wrong</h1>
        <pre>${JSON.stringify(error, null, 2)}</pre>
      </body>
    </html>
  `;
}
