import Spinner from "react-bootstrap/Spinner";
import { LOADING_LABEL } from "../config/IT";
import "./LoadingScreen.css";

export default function LoadingScreen() {
  return (
    <div className="CenteredPageVertical">
      <Spinner animation="border" variant="light" />
      <span className="CenteredPage-text">{LOADING_LABEL}</span>
    </div>
  );
}
