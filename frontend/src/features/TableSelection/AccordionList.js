import { Accordion } from "react-bootstrap";
import TableSelectionList from "./SelectionList";

/**
 * Shows a series of accordion, continues to shows accordion until it reach the deepes level
 * On the deepest level there is a list of record
 *
 * @param {Object[]} props.data
 * @param {Object} props.selectedElement - Element currently selected
 * @param {Function} props.onSelectElement - Function to update the selected element
 */
export default function AccordionList({
  data,
  selectedElement,
  onSelectElement,
}) {
  return (
    <Accordion alwaysOpen>
      {Object.entries(data).map(([key, value]) => (
        <Accordion.Item eventKey={key} key={key}>
          <Accordion.Header>{key}</Accordion.Header>
          <Accordion.Body>
            {Array.isArray(value) ? (
              <TableSelectionList
                objectList={Object.values(value)}
                selectedElement={selectedElement}
                onSelectElement={onSelectElement}
              />
            ) : (
              <AccordionList
                data={value}
                selectedElement={selectedElement}
                onSelectElement={onSelectElement}
              />
            )}
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
