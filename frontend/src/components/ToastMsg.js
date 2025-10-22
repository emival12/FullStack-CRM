import { Toast, ToastContainer } from "react-bootstrap";

export default function ToastMsg({
  showToast,
  setShowToast,
  color,
  title,
  body,
}) {
  return (
    <ToastContainer position="bottom-end" className="p-3">
      <Toast
        onClose={() => setShowToast(false)}
        show={showToast}
        bg={color}
        delay={3000}
        autohide
      >
        <Toast.Header closeButton={false}>
          <strong className="me-auto">{title}</strong>
        </Toast.Header>
        <Toast.Body className="text-white">{body}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
}
