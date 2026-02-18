export type ToastConfig = {
  show: boolean;
  title: string;
  body: string;
  color?: "success" | "danger" | "warning";
};

export type ModalConfig = {
  show: boolean;
  title: string;
  body: string;
};
