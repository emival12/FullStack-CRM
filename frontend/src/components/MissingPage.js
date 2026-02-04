import "../App.css";
import { getLabel } from "../config/Label";

/**
 * Shows a missing text
 *
 * @param {String} props.missingText     - Text to show in the screen
 * @param {Boolean} props.ShowImg        - Boolean to show or hide the image
 */
export default function MissingPage({ missingText, ShowImg = true }) {
  return (
    <div className="CenteredPage flex-row mt-3">
      {ShowImg && <i className="bi bi-x-octagon fs-2 pe-2 text-danger"></i>}
      <span className="fw-bold">
        {missingText || getLabel("MISSING.MISSING_DEFAULT_LABEL")}
      </span>
    </div>
  );
}
