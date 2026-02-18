import type { MissingPageProps } from "./MissingPage.types.js";

import "@App.css";
import { useLabels } from "@context/Label/Label.js";

/**
 * Displays error messages or a 'data missing' notification.
 */
export default function MissingPage({
  missingText,
  showImg = true,
}: MissingPageProps): React.ReactElement {
  const { getLabel } = useLabels();

  return (
    <div className="h-100 d-flex align-items-center justify-content-center mt-3">
      {showImg && <i className="bi bi-x-octagon fs-2 pe-2 text-danger"></i>}
      <span className="fw-bold">
        {missingText || getLabel("MISSING.MISSING_DEFAULT_LABEL")}
      </span>
    </div>
  );
}
