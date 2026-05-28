import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { ToastContainer } from "react-bootstrap";
import type {
  ToastContextType,
  ToastProviderProps,
  ShowToastFunc,
  ToastDef,
} from "./Toast.types";
import ToastMsg from "./ToastMsg";

//Creation of context (place where i can save things and avoid the props)
const ToastContext = createContext<ToastContextType | null>(null);

// This is just a shotcut to avoid to repeat for every component the "useContext(ToastContext)"
// because to use useContext(ToastContext) you have to import all the time ToastContext
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
};

export default function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastDef[]>([]);

  const showToast: ShowToastFunc = useCallback((variant, body, title) => {
    const newToast: ToastDef = {
      id: crypto.randomUUID(),
      variant,
      body,
      title,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer position="bottom-end" className="p-3">
        {toasts.map((t) => (
          <ToastMsg
            key={t.id}
            variant={t.variant}
            title={t.title}
            body={t.body}
            closeToast={() =>
              setToasts((prev) => prev.filter((toast) => toast.id !== t.id))
            }
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}
