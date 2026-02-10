import "../App.css";
import Spinner from "react-bootstrap/Spinner";
import { useLabels } from "../config/Label";

export default function LoadingScreen() {
  const { getLabel } = useLabels();

  return (
    <div className="w-100 h-100 d-flex align-items-center justify-content-center fs-5 flex-grow-1">
      <Spinner animation="border" variant="light" />
      <span className="fw-bold ps-2">{getLabel("GENERIC.LOADING_LABEL")}</span>
    </div>
  );
}
