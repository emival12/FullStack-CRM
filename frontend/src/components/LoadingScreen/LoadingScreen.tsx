import "App.css";
import { Spinner } from "react-bootstrap";

import { useLabels } from "context/Label/Label";

type LoadingScreenProps = { compact?: boolean };
export default function LoadingScreen({
  compact = false,
}: LoadingScreenProps): React.ReactElement {
  const { getLabel } = useLabels();

  return (
    <div className="w-100 h-100 d-flex align-items-center justify-content-center fs-5 flex-grow-1">
      <Spinner animation="border" variant="light" />
      {!compact && (
        <span className="fw-bold ps-2">{getLabel("UI.LOADING")}</span>
      )}
    </div>
  );
}
