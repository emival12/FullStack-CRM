import Spinner from "react-bootstrap/Spinner";
import { LOADING_LABEL } from "../config/IT";
import "../App.css";

export default function LoadingScreen() {
  return (
    <div className="CenteredPage HalfPageHeight flex-column">
      <Spinner animation="border" variant="light" />
      <span className="fw-bold">{LOADING_LABEL}</span>
    </div>
  );
}
