import "bootstrap-icons/font/bootstrap-icons.css";
import { MISSING_DEFAULT_LABEL } from "../config/IT";
import "./LoadingScreen.css";

export default function MissingPage({ MissingText }) {
  return (
    <div className="CenteredPageHorizontal">
      <i className="bi bi-x-octagon missingIcon"></i>
      <span className="CenteredPage-text">
        {MissingText || MISSING_DEFAULT_LABEL}
      </span>
    </div>
  );
}
