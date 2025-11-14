import { Toast, ToastContainer } from "react-bootstrap";

/**
 * Shows a Toast message
 *
 * @param {Object} props.showToast        - Boolean to show or hide the Toast message
 * @param {Function} props.setShowToast   - Function to set the Boolean
 * @param {string} props.color            - Background Color of the Toast
 * @param {Object} props.title            - Text to set as title
 * @param {Object} props.body             - Text to set in the body
 */
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
