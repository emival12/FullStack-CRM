import { ListGroup } from "react-bootstrap";

/**
 * Shows a list of record
 *
 * @param {Object[]} props.objectList - List of the record to show
 * @param {Object} props.selectedElement - Element currently selected
 * @param {Function} props.onSelectElement - Function to update the selected element
 * @param {string} props.displayField - Field to show in the frontend
 */
export default function SelectionList({
  objectList,
  selectedElement,
  onSelectElement,
  displayField = "label",
}) {
  return (
    <ListGroup variant="flush">
      {objectList.map((element) => (
        <ListGroup.Item
          action
          key={element.key}
          active={element === selectedElement}
          onClick={() => onSelectElement(element)}
        >
          {element[displayField]}
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}
