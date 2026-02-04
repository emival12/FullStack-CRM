import { Button, Modal } from "react-bootstrap";
import { getLabel } from "../config/Label";

/**
 * Shows a modal with a message and two buttons: one to confirm, the other one to cancel
 *
 * @param {Boolean} props.showModal               - Flag to decide to show or hide the modal
 * @param {Function} props.setShowModal           - Method to set the flag showModal
 * @param {Function} props.successFunction        - Function executed in case of confirm
 * @param {String} props.titleText                - Text showed as title inside the modal
 * @param {String} props.bodyText                 - Text showed as body inside the modal
 */
export default function ModalScreen({
  showModal,
  setShowModal,
  successFunction,
  titleText,
  bodyText,
}) {
  return (
    <Modal show={showModal} onHide={() => setShowModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>{titleText}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>{bodyText}</p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowModal(false)}>
          {getLabel("BUTTONS.CANCEL_LABEL")}
        </Button>
        <Button variant="primary" onClick={() => successFunction()}>
          {getLabel("BUTTONS.CONFIRM_LABEL")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
