export interface ToastMsgProps {
  /** Flag to decide to show or hide the Toast message */
  showToast: boolean;

  /** Set method of the flag showToast */
  setShowToast: (showToast: boolean) => void;

  /** Background Color of the Toast */
  color: "success" | "danger" | "warning";

  /** Text showed as title */
  title: string;

  /** Text showed as body */
  body: string;
}
