import "bootstrap-icons/font/bootstrap-icons.css";
import { MISSING_DEFAULT_LABEL } from "../config/IT";
import "../App.css";

export default function MissingPage({ MissingText, ShowImg = true }) {
  return (
    <div className="CenteredPage flex-row mt-3">
      {ShowImg && <i className="bi bi-x-octagon fs-2 pe-2 text-danger"></i>}
      <span className="fw-bold">{MissingText || MISSING_DEFAULT_LABEL}</span>
    </div>
  );
}
