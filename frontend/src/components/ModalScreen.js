import { Button, Modal } from "react-bootstrap";
import { CANCEL_LABEL, CONFIRM_LABEL } from "../config/IT";

/**
 * Shows a table of record
 *
 * @param {Object[]} props.showModal            - Flag to decide to show or hide the modal
 * @param {Object[]} props.setShowModal         - Method to set the flag showModal
 * @param {Object[]} props.successFunction      - Function executed in case of confirm
 * @param {Object[]} props.titleText            - Text showed as title inside the modal
 * @param {Object[]} props.bodyText             - Text showed as body inside the modal
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
          {CANCEL_LABEL}
        </Button>
        <Button variant="primary" onClick={() => successFunction()}>
          {CONFIRM_LABEL}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
