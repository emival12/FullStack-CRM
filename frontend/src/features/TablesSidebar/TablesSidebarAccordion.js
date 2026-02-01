import { Accordion } from "react-bootstrap";
import TablesSidebarList from "./TablesSidebarList";

/**
 * Shows a series of accordion, continues to shows accordion until it reach the deepes level
 * On the deepest level there is a list of options, each option is a tables
 *
 * @param {Object[]} props.tablesData             - Contains the data retrieved from the query
 * @param {String} props.tableKey                 - TableKey currently selected
 * @param {Function} props.toggleSidebar          - Function to close the Sidebar (phone sidebar only)
 */
export default function TablesSidebarAccordion({
  tablesData,
  tableKey,
  toggleSidebar,
}) {
  return (
    <Accordion alwaysOpen>
      {Object.entries(tablesData).map(([key, value]) => (
        <Accordion.Item eventKey={key} key={key}>
          <Accordion.Header>{key}</Accordion.Header>
          <Accordion.Body>
            {Object.entries(value).map(([idx, item]) => {
              const keys = Object.keys(item);
              if (keys.length === 1) {
                return (
                  <TablesSidebarAccordion
                    key={idx}
                    tablesData={item}
                    tableKey={tableKey}
                    toggleSidebar={toggleSidebar}
                  />
                );
              }

              return (
                <TablesSidebarList
                  key={idx}
                  tableItem={item}
                  tableKey={tableKey}
                  toggleSidebar={toggleSidebar}
                />
              );
            })}
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
