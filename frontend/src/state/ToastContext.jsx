import { createContext, useContext, useEffect, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  useEffect(() => {
    if (!toast.visible) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToast((current) => ({ ...current, visible: false }));
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [toast.visible]);

  const value = {
    toast,
    showToast(message, type = "info") {
      setToast({ visible: true, message, type });
    }
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
