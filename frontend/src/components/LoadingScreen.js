import "../App.css";
import Spinner from "react-bootstrap/Spinner";
import { getLabel } from "../config/Label";

export default function LoadingScreen() {
  return (
    <div className="CenteredPage HalfPageHeight flex-column">
      <Spinner animation="border" variant="light" />
      <span className="fw-bold">{getLabel("GENERIC.LOADING_LABEL")}</span>
    </div>
  );
}
