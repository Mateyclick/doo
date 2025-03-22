
// This file replaces the import from shadcn with our own implementation
import { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast";
import { createContext, useContext, useState } from "react";

type ToastContextType = {
  toast: (props: ToastProps & {
    description?: React.ReactNode;
    title?: React.ReactNode;
    action?: ToastActionElement;
  }) => void;
  _toasts: Array<{
    id: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: ToastActionElement;
    [key: string]: any;
  }>;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      title?: React.ReactNode;
      description?: React.ReactNode;
      action?: ToastActionElement;
      [key: string]: any;
    }>
  >([]);

  const toast = (props: ToastProps & {
    description?: React.ReactNode;
    title?: React.ReactNode;
    action?: ToastActionElement;
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prevToasts) => [...prevToasts, { id, ...props }]);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ toast, _toasts: toasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
};
