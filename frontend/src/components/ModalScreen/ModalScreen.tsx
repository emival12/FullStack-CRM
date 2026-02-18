import { Button, Modal } from "react-bootstrap";
import type { ModalScreenProps } from "./ModalScreen.types";

import { useLabels } from "context/Label/Label";

/**
 * Displays a modal with a message and two buttons: one to confirm, the other one to cancel
 */
export default function ModalScreen({
  showModal,
  setShowModal,
  successFunction,
  titleText,
  bodyText,
}: ModalScreenProps): React.ReactElement {
  const { getLabel } = useLabels();

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
