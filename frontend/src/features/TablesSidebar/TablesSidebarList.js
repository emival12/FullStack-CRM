import { ListGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import { PATH_DATABASE } from "../../config/K";

/**
 * Shows a list of record
 *
 * @param {Object[]} props.objectElem       - Record to show
 * @param {Object} props.selectedElement    - Element currently selected
 * @param {Function} props.onSelectElement  - Function to update the selected element
 * @param {string} props.displayField       - Field to show in the frontend
 */
export default function TablesSidebarList({
  objectElem,
  selectedElement,
  onSelectElement,
  displayField = "label",
}) {
  return (
    <ListGroup variant="flush">
      <ListGroup.Item
        action
        as={Link}
        to={PATH_DATABASE + "/" + objectElem.label}
        key={objectElem.key}
        active={objectElem === selectedElement}
        onClick={() => onSelectElement(objectElem)}
      >
        {objectElem[displayField]}
      </ListGroup.Item>
    </ListGroup>
  );
}
