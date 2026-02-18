export interface ModalScreenProps {
  /** Flag to decide to show or hide the modal */
  showModal: boolean;

  /** Set method of the flag showModal */
  setShowModal: (showModal: boolean) => void;

  /** Function executed in case of confirm */
  successFunction: () => void;

  /** Text showed as title inside the modal */
  titleText: string;

  /** Text showed as body inside the modal */
  bodyText: string;
}
