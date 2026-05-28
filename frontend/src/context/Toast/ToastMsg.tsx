import { Toast } from "react-bootstrap";
import { ToastProp, ToastVariant } from "./Toast.types";

const variantToBg: Record<ToastVariant, string> = {
  success: "success",
  error: "danger",
  warning: "warning",
  info: "info",
};

/**
 *  Displays a Toast message
 */
export default function ToastMsg({
  variant,
  title,
  body,
  closeToast,
}: ToastProp): React.ReactElement {
  return (
    <Toast onClose={closeToast} bg={variantToBg[variant]} delay={3000} autohide>
      <Toast.Header closeButton={false}>
        <strong className="me-auto">{title}</strong>
      </Toast.Header>
      <Toast.Body className="text-white">{body}</Toast.Body>
    </Toast>
  );
}
