import { createContext, useContext, useState } from "react";

const ToastContext = createContext<any>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");

  return (
    <ToastContext.Provider value={{ setMessage }}>
      {children}

      {message && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            background: "black",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
          }}
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
