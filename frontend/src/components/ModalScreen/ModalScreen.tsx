import { Button, Modal, Spinner } from "react-bootstrap";

import { useLabels } from "@/context/Label/Label";

import type { ModalScreenProps } from "./ModalScreen.types";

/**
 * Displays a modal with a message and two buttons: one to confirm, the other one to cancel
 */
export default function ModalScreen({
  showModal,
  setShowModal,
  successFunction,
  titleText,
  bodyText,
  loading,
  destructive = false,
}: ModalScreenProps): React.ReactElement {
  const { getLabel } = useLabels();

  return (
    <Modal
      show={showModal}
      onHide={loading ? undefined : () => setShowModal(false)}
    >
      <Modal.Header closeButton>
        <Modal.Title>{titleText}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>{bodyText}</p>
      </Modal.Body>

      <Modal.Footer>
        <Button
          disabled={loading}
          variant="secondary"
          onClick={() => setShowModal(false)}
        >
          {getLabel("BUTTONS.CANCEL")}
        </Button>
        <Button
          disabled={loading}
          variant={destructive ? "danger" : "primary"}
          onClick={() => successFunction()}
        >
          {loading ? <Spinner size="sm" /> : getLabel("BUTTONS.CONFIRM")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
