export type ToastVariant = "success" | "error" | "warning" | "info";

interface BaseToast {
  variant: ToastVariant;
  title?: string;
  body: string;
}

export interface ToastProp extends BaseToast {
  closeToast: () => void;
}

export interface ToastDef extends BaseToast {
  id: string;
}

export type ShowToastFunc = (
  variant: ToastVariant,
  body: string,
  title?: string,
) => void;

export interface ToastContextType {
  showToast: ShowToastFunc;
}

export interface ToastProviderProps {
  children: React.ReactNode;
}
