import { Accordion } from "react-bootstrap";
import TablesSidebarList from "./TablesSidebarList";

/**
 * Shows a series of accordion, continues to shows accordion until it reach the deepes level
 * On the deepest level there is a list of record
 *
 * @param {Object[]} props.data             - Contains the data retrieved from the query
 * @param {Object} props.selectedElement    - Element currently selected
 * @param {Function} props.onSelectElement  - Function to update the selected element
 */
export default function TablesSidebarAccordion({
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
            {Object.entries(value).map(([idx, item]) => {
              const keys = Object.keys(item);
              if (keys.length === 1) {
                return (
                  <TablesSidebarAccordion
                    key={idx}
                    data={item}
                    selectedElement={selectedElement}
                    onSelectElement={onSelectElement}
                  />
                );
              }

              return (
                <TablesSidebarList
                  key={idx}
                  objectElem={item}
                  selectedElement={selectedElement}
                  onSelectElement={onSelectElement}
                />
              );
            })}
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
